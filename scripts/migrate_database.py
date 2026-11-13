"""
Database Migration and Schema Deployment Script for Knowledge Brain.
Enables pgvector extension, provisions all 10 ORM tables, builds HNSW cosine index,
and verifies schema integrity against live Neon Cloud PostgreSQL instance.
Never logs credentials or passwords.
"""

import os
import sys
import re
from sqlalchemy import text, inspect

# Ensure backend package is in python path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(project_root, "backend"))

from app.database import get_engine, sanitize_db_url, check_db_health
from app.models import Base

EXPECTED_TABLES = [
    "users",
    "conversations",
    "memories",
    "memory_versions",
    "memory_sources",
    "memory_permissions",
    "deletion_requests",
    "verification_records",
    "memory_dependencies",
    "memory_semantic_links",
    "experience_records",
    "context_records",
    "knowledge_records",
    "lifecycle_events"
]

def run_migrations():
    print("=================================================================")
    print("   KNOWLEDGE BRAIN — DATABASE MIGRATION & PROVISIONING RUNNER   ")
    print("=================================================================")
    
    health = check_db_health()
    print(f"Connection Target: {health.get('target', 'unconfigured')}")
    print(f"Initial Health Status: {health.get('status')} - {health.get('message')}")
    
    if health.get("status") == "unconfigured":
        print("\n[BLOCKED] Cannot run migrations: DATABASE_URL is not configured with live credentials in .env")
        print("Please configure your PostgreSQL connection string in .env:")
        print("  DATABASE_URL=postgresql://<user>:<password>@<host>/<dbname>")
        return False
        
    engine = get_engine()
    if engine is None:
        print("\n[ERROR] Failed to obtain database engine.")
        return False
        
    try:
        with engine.connect() as conn:
            # 1. Enable pgvector extension
            print("\nStep 1: Enabling pgvector extension...")
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
            conn.commit()
            print("  ✓ 'vector' extension enabled successfully.")
            
            # 2. Non-destructive Alter Table for Progressive Hierarchical Columns on memories
            print("\nStep 2: Checking and upgrading 'memories' table columns for Progressive Hierarchy...")
            alter_stmts = [
                "ALTER TABLE memories ADD COLUMN IF NOT EXISTS hierarchy_level INTEGER NOT NULL DEFAULT 2;",
                "ALTER TABLE memories ADD COLUMN IF NOT EXISTS promotion_status VARCHAR(32) NOT NULL DEFAULT 'none';",
                "ALTER TABLE memories ADD COLUMN IF NOT EXISTS evidence_count INTEGER NOT NULL DEFAULT 1;",
                "ALTER TABLE memories ADD COLUMN IF NOT EXISTS quality_score FLOAT NOT NULL DEFAULT 0.7;",
                "ALTER TABLE memories ADD COLUMN IF NOT EXISTS promoted_at TIMESTAMP WITH TIME ZONE;",
                "ALTER TABLE memories ADD COLUMN IF NOT EXISTS promoted_by VARCHAR(128);",
                "ALTER TABLE memories ADD COLUMN IF NOT EXISTS parent_context_id UUID REFERENCES memories(id) ON DELETE SET NULL;",
                "ALTER TABLE memories ADD COLUMN IF NOT EXISTS superseded_by_id UUID REFERENCES memories(id) ON DELETE SET NULL;"
            ]
            for stmt in alter_stmts:
                conn.execute(text(stmt))
            conn.commit()
            print("  ✓ Progressive hierarchy columns verified/added on 'memories'.")

            # 3. Deploy All 14 ORM Tables via Base.metadata
            print("\nStep 3: Provisioning 14 ORM tables via SQLAlchemy metadata...")
            Base.metadata.create_all(bind=engine)
            print("  ✓ Table metadata deployment completed.")
            
            # 4. Create HNSW Cosine Index for pgvector
            print("\nStep 4: Creating HNSW index on memories.embedding (m=16, ef_construction=64)...")
            hnsw_sql = """
            CREATE INDEX IF NOT EXISTS idx_memories_embedding_hnsw 
            ON memories USING hnsw (embedding vector_cosine_ops) 
            WITH (m = 16, ef_construction = 64);
            """
            conn.execute(text(hnsw_sql))
            conn.commit()
            print("  ✓ HNSW cosine index created successfully.")
            
            # 5. Create Performance Query Indexes
            print("\nStep 5: Ensuring composite performance and hierarchical indexes...")
            indexes_sql = [
                "CREATE INDEX IF NOT EXISTS idx_mem_conv_status ON memories (conversation_id, status);",
                "CREATE INDEX IF NOT EXISTS idx_mem_type_salience ON memories (memory_type, importance_score);",
                "CREATE INDEX IF NOT EXISTS idx_perm_agent_read ON memory_permissions (agent_id, can_read);",
                "CREATE INDEX IF NOT EXISTS idx_mem_hierarchy_level ON memories (hierarchy_level);",
                "CREATE INDEX IF NOT EXISTS idx_mem_promotion_status ON memories (promotion_status);",
                "CREATE INDEX IF NOT EXISTS idx_mem_parent_context ON memories (parent_context_id);",
                "CREATE INDEX IF NOT EXISTS idx_exp_rec_mem_id ON experience_records (memory_id);",
                "CREATE INDEX IF NOT EXISTS idx_ctx_rec_mem_id ON context_records (memory_id);",
                "CREATE INDEX IF NOT EXISTS idx_kno_rec_mem_id ON knowledge_records (memory_id);",
                "CREATE INDEX IF NOT EXISTS idx_lfc_event_mem_id ON lifecycle_events (memory_id);"
            ]
            for idx_stmt in indexes_sql:
                conn.execute(text(idx_stmt))
            conn.commit()
            print("  ✓ Hierarchical and composite performance indexes verified.")
            
            # 5. Verify Deployed Schema Tables
            print("\nStep 5: Verifying deployed tables in database...")
            inspector = inspect(engine)
            deployed_tables = inspector.get_table_names()
            print(f"  Deployed tables found ({len(deployed_tables)}): {deployed_tables}")
            
            missing = [t for t in EXPECTED_TABLES if t not in deployed_tables]
            if missing:
                print(f"  [ERROR] Missing tables: {missing}")
                return False
                
            print("  ✓ All 10 required domain and relationship tables verified live.")
            
        print("\n=================================================================")
        print("   DATABASE MIGRATION & PROVISIONING COMPLETED SUCCESSFULLY!    ")
        print("=================================================================")
        return True
        
    except Exception as e:
        safe_msg = re.sub(r"://([^:]+):([^@]+)@", r"://\1:***@", str(e))
        print(f"\n[MIGRATION ERROR] {safe_msg}")
        return False

if __name__ == "__main__":
    success = run_migrations()
    sys.exit(0 if success else 1)
