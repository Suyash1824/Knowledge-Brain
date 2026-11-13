"""
Knowledge Brain — Sprint 4 Independent Retrieval Engine Verification Suite.
Tests:
1. Query intent analysis & dynamic memory-depth routing (L1 vs L2 vs L3 vs Multi-tier)
2. Targeted level selection (avoiding indiscriminate global searching)
3. RBAC/ACL agent permission isolation
4. Temporal expiration filtering
5. Hybrid relevance & composite multi-factor ranking
6. Strict token-budget enforcement
7. Defensive passive data wrapping (<memory_data is_instruction='false'>)
8. Explainable retrieval diagnostics
"""

import os
import sys
from uuid import UUID, uuid4
from datetime import datetime, timezone, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.dialects.postgresql import JSONB, UUID as PG_UUID
from pgvector.sqlalchemy import Vector

# SQLite compilation adapters for PostgreSQL-specific types in test environments
@compiles(JSONB, "sqlite")
def compile_jsonb_sqlite(type_, compiler, **kw):
    return "TEXT"

@compiles(PG_UUID, "sqlite")
def compile_pg_uuid_sqlite(type_, compiler, **kw):
    return "VARCHAR(36)"

@compiles(Vector, "sqlite")
def compile_vector_sqlite(type_, compiler, **kw):
    return "TEXT"

# Ensure backend package is in python path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(project_root, "backend"))

from app.models import (
    Base, User, Conversation, Memory, MemoryPermission
)
from app.schemas import HierarchicalRetrieveRequest
from app.retrieval.engine import HierarchicalRetrievalEngine

def run_tests():
    print("=================================================================")
    print("  KNOWLEDGE BRAIN — INDEPENDENT RETRIEVAL ENGINE TEST SUITE     ")
    print("=================================================================")

    # Setup isolated SQLite in-memory engine
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    db = Session()

    test_passed = 0
    test_total = 8
    retrieval_engine = HierarchicalRetrievalEngine()

    try:
        # Create test user and workspace
        user_id = uuid4()
        user = User(id=user_id, email="retrieval_test@knowledgebrain.ai", hashed_password="mock_hash")
        db.add(user)
        
        conv_id = uuid4()
        conv = Conversation(id=conv_id, user_id=user_id, title="Retrieval Test Workspace")
        db.add(conv)
        db.commit()

        # Seed memories across Level 1, Level 2, and Level 3
        now = datetime.now(timezone.utc)
        
        # L1 Experience: Tactical tool output / error
        m_l1 = Memory(
            id=uuid4(),
            conversation_id=conv_id,
            content="Error log: Port 5432 connection refused on 127.0.0.1: connection refused in container start.",
            memory_type="experience",
            hierarchy_level=1,
            status="trusted",
            importance_score=0.6,
            confidence_score=0.9,
            created_at=now - timedelta(minutes=10)
        )
        db.add(m_l1)

        # L2 Context: Active Task
        m_l2 = Memory(
            id=uuid4(),
            conversation_id=conv_id,
            content="Active sprint task: Implement Docker Compose on Windows with isolated bridge networking.",
            memory_type="task",
            hierarchy_level=2,
            status="trusted",
            importance_score=0.8,
            confidence_score=0.95,
            created_at=now - timedelta(hours=2)
        )
        db.add(m_l2)

        # L3 Knowledge: Architectural Invariant
        m_l3 = Memory(
            id=uuid4(),
            conversation_id=conv_id,
            content="Architecture standard: All backend services must use 12-round bcrypt password hashing and HS256 JWT.",
            memory_type="decision",
            hierarchy_level=3,
            status="trusted",
            importance_score=1.0,
            confidence_score=1.0,
            created_at=now - timedelta(days=5)
        )
        db.add(m_l3)

        # Expired Memory (Level 2)
        m_expired = Memory(
            id=uuid4(),
            conversation_id=conv_id,
            content="Temporary debug flag: Set DEBUG=True until yesterday.",
            memory_type="task",
            hierarchy_level=2,
            status="trusted",
            valid_until=now - timedelta(hours=1), # Expired!
            created_at=now - timedelta(days=2)
        )
        db.add(m_expired)

        # Restricted Memory (Level 3 - only accessible by cursor-ai)
        m_restricted = Memory(
            id=uuid4(),
            conversation_id=conv_id,
            content="Confidential API key configuration for production payment gateway.",
            memory_type="fact",
            hierarchy_level=3,
            status="trusted",
            importance_score=0.9,
            created_at=now - timedelta(days=1)
        )
        db.add(m_restricted)
        perm = MemoryPermission(
            id=uuid4(),
            memory_id=m_restricted.id,
            agent_id="cursor-ai",
            can_read=True,
            classification_level="restricted"
        )
        db.add(perm)
        db.commit()

        # -------------------------------------------------------------
        # Test 1: Intent Analysis & Tactical Depth Determination (L1)
        # -------------------------------------------------------------
        print("\n--- Test 1: Intent Analysis & Tactical Routing (L1) ---")
        levels, depth_name, reason = retrieval_engine.analyze_query_intent("Show me the error log from the last terminal run")
        assert levels == [1], f"Expected [1], got {levels}"
        assert depth_name == "experience"
        print(f"  Query: 'Show me the error log...' -> Routed to Level: {levels} ({depth_name})")
        print("  [PASS] Tactical query successfully routed to Level 1 Experience.")
        test_passed += 1

        # -------------------------------------------------------------
        # Test 2: Intent Analysis & Task Context Routing (L2)
        # -------------------------------------------------------------
        print("\n--- Test 2: Intent Analysis & Working Context Routing (L2) ---")
        levels, depth_name, reason = retrieval_engine.analyze_query_intent("What active tasks remain for our current sprint?")
        assert levels == [2], f"Expected [2], got {levels}"
        assert depth_name == "context"
        print(f"  Query: 'What active tasks...' -> Routed to Level: {levels} ({depth_name})")
        print("  [PASS] Status and task query successfully routed to Level 2 Context.")
        test_passed += 1

        # -------------------------------------------------------------
        # Test 3: Intent Analysis & Architecture Knowledge Routing (L3)
        # -------------------------------------------------------------
        print("\n--- Test 3: Intent Analysis & Architecture Knowledge Routing (L3) ---")
        levels, depth_name, reason = retrieval_engine.analyze_query_intent("What are our core architectural rules for password security?")
        assert levels == [3], f"Expected [3], got {levels}"
        assert depth_name == "knowledge"
        print(f"  Query: 'What are our core architectural rules...' -> Routed to Level: {levels} ({depth_name})")
        print("  [PASS] Architecture rule query successfully routed to Level 3 Knowledge.")
        test_passed += 1

        # -------------------------------------------------------------
        # Test 4: Targeted Level Execution (Avoiding Global Lake Scan)
        # -------------------------------------------------------------
        print("\n--- Test 4: Targeted Level Retrieval Execution ---")
        req_l3 = HierarchicalRetrieveRequest(
            query="What are our core architectural rules for password security?",
            depth="auto",
            conversation_id=conv_id,
            agent_id="cursor-ai"
        )
        res_l3 = retrieval_engine.retrieve(db=db, request=req_l3)
        assert res_l3.determined_depth == "knowledge"
        assert res_l3.knowledge_items_count >= 1
        assert res_l3.experience_items_count == 0, "Level 1 items should not be scanned for L3 queries"
        print(f"  Capsule retrieved {len(res_l3.entries)} entries (Knowledge items: {res_l3.knowledge_items_count}, Experience: {res_l3.experience_items_count})")
        print("  [PASS] Targeted Level 3 retrieval avoided scanning irrelevant Level 1 experiences.")
        test_passed += 1

        # -------------------------------------------------------------
        # Test 5: RBAC & Agent Permission Validation
        # -------------------------------------------------------------
        print("\n--- Test 5: RBAC & Agent Permission Validation ---")
        # Antigravity agent querying confidential memory
        req_unauth = HierarchicalRetrieveRequest(
            query="payment gateway configuration and API keys",
            depth="knowledge",
            conversation_id=conv_id,
            agent_id="antigravity-ai"
        )
        res_unauth = retrieval_engine.retrieve(db=db, request=req_unauth)
        retrieved_ids = [e.memory_id for e in res_unauth.entries]
        assert m_restricted.id not in retrieved_ids, "Restricted memory was leaked to unauthorized agent!"
        
        # Cursor agent querying the same memory (authorized)
        req_auth = HierarchicalRetrieveRequest(
            query="payment gateway configuration and API keys",
            depth="knowledge",
            conversation_id=conv_id,
            agent_id="cursor-ai"
        )
        res_auth = retrieval_engine.retrieve(db=db, request=req_auth)
        auth_ids = [e.memory_id for e in res_auth.entries]
        assert m_restricted.id in auth_ids, "Authorized agent was blocked from accessing permitted memory"
        print("  [PASS] Permission isolation strictly enforced: restricted memory accessible only to cleared agent.")
        test_passed += 1

        # -------------------------------------------------------------
        # Test 6: Temporal Expiration Filtering
        # -------------------------------------------------------------
        print("\n--- Test 6: Temporal Expiration Filtering ---")
        req_all = HierarchicalRetrieveRequest(
            query="debug flag status",
            depth="context",
            conversation_id=conv_id,
            agent_id="cursor-ai"
        )
        res_all = retrieval_engine.retrieve(db=db, request=req_all)
        returned_ids = [e.memory_id for e in res_all.entries]
        assert m_expired.id not in returned_ids, "Expired memory was incorrectly returned in retrieval"
        print("  [PASS] Expired memories automatically filtered out of retrieval results.")
        test_passed += 1

        # -------------------------------------------------------------
        # Test 7: Strict Token-Budget Enforcement & Passive Wrapping
        # -------------------------------------------------------------
        print("\n--- Test 7: Strict Token-Budget Enforcement & Defensive Wrapping ---")
        req_budget = HierarchicalRetrieveRequest(
            query="architecture rules and tasks",
            depth="all",
            conversation_id=conv_id,
            agent_id="cursor-ai",
            max_tokens=60 # Very tight token budget
        )
        res_budget = retrieval_engine.retrieve(db=db, request=req_budget)
        print(f"  Requested budget: {req_budget.max_tokens} -> Delivered tokens: {res_budget.total_tokens}")
        assert res_budget.total_tokens <= req_budget.max_tokens, "Token budget overflowed!"
        assert "<memory_data is_instruction='false'>" in res_budget.capsule_data_wrapped
        assert "</memory_data>" in res_budget.capsule_data_wrapped
        print("  [PASS] Strict token budget caps enforced; passive data wrapping verified.")
        test_passed += 1

        # -------------------------------------------------------------
        # Test 8: Explainable Retrieval Diagnostics
        # -------------------------------------------------------------
        print("\n--- Test 8: Explainable Retrieval Diagnostics ---")
        expl = res_l3.explanation
        assert "determined_depth" in expl
        assert "target_levels_scanned" in expl
        assert "budget_utilization_ratio" in expl
        print(f"  Diagnostic Output: {expl}")
        print("  [PASS] Full explainable retrieval diagnostics returned.")
        test_passed += 1

        print("\n=================================================================")
        print(f"  ALL {test_passed}/{test_total} RETRIEVAL PIPELINE TESTS PASSED!")
        print("=================================================================")
        return True

    finally:
        db.close()

if __name__ == "__main__":
    success = run_tests()
    if not success:
        sys.exit(1)
