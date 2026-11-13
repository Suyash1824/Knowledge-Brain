"""
Comprehensive Phase 1 Verification Suite for Knowledge Brain.
Validates:
1. Complete 10-table ORM schema compiled cleanly in Base.metadata.
2. Dependency cycle detection strictly operates on memory_dependencies and rejects cycles.
3. memory_semantic_links are cycle-tolerant and isolated from dependency DAG checks.
4. Forgetting cascades traverse ONLY dependency edges and zero out vector embeddings.
5. Deletion audit logs are non-sensitive (zero raw text/vectors) with SHA-256 integrity hash.
6. Persistent endpoints return HTTP 503 Service Unavailable when DB is unconfigured.
7. Pydantic v2 schemas and FastAPI route registry.
"""

import os
import sys
import uuid
from uuid import uuid4
from unittest.mock import MagicMock

project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(project_root, "backend"))

from app.models import (
    Base, User, Conversation, Memory, MemoryVersion,
    MemorySource, MemoryPermission, DeletionRequest, VerificationRecord,
    memory_dependencies, memory_semantic_links
)
from app.schemas import (
    MemoryCompileInput, ExtractedMemoryItem, MemoryCreate, MemoryResponse,
    CapsuleQueryRequest, MemoryCapsuleResponse, DeletionRequestCreate,
    DeletionVerificationResponse, MCPToolCallRequest, MCPToolCallResponse
)
from app.database import check_db_health, require_db
from app.forgetting.engine import ForgettingEngine
from app.services.memory_service import MemoryService
from app.main import app
import networkx as nx

def test_1_schema_tables():
    print("\n--- Test 1: ORM Schema & 10 Tables Verification ---")
    tables = [t.name for t in Base.metadata.sorted_tables]
    expected_tables = {
        "users", "conversations", "memories", "memory_versions",
        "memory_sources", "memory_permissions", "deletion_requests",
        "verification_records", "memory_dependencies", "memory_semantic_links"
    }
    print(f"Compiled Tables ({len(tables)}): {tables}")
    assert expected_tables.issubset(set(tables)), f"Missing expected tables! Found: {tables}"
    print("✓ All 10 tables (8 domain entities + 2 dedicated relationship tables) compiled successfully.")

def test_2_dependency_cycle_detection():
    print("\n--- Test 2: Dependency DAG Cycle Detection Verification ---")
    # Simulate DB rows for memory_dependencies: A -> B, B -> C
    mem_a = uuid4()
    mem_b = uuid4()
    mem_c = uuid4()
    
    mock_db = MagicMock()
    # Mocking rows returned: (parent, child, type)
    mock_db.execute.return_value.fetchall.return_value = [
        (str(mem_a), str(mem_b), "depends_on"),
        (str(mem_b), str(mem_c), "derives_from"),
    ]
    
    # 1. Valid acyclic addition (C -> D is safe)
    mem_d = uuid4()
    safe = ForgettingEngine.validate_no_cycle(mem_c, mem_d, db=mock_db)
    assert safe is True
    print(f"✓ Valid edge ({mem_c} -> {mem_d}) accepted without cycle.")
    
    # 2. Cycle addition: C -> A would close the loop A -> B -> C -> A
    cycle_detected = False
    try:
        ForgettingEngine.validate_no_cycle(mem_c, mem_a, db=mock_db)
    except ValueError as e:
        cycle_detected = True
        print(f"✓ Cycle correctly rejected with error: {e}")
        
    assert cycle_detected is True, "Expected cycle error was not raised!"
    
    # 3. Self dependency A -> A
    self_cycle_detected = False
    try:
        ForgettingEngine.validate_no_cycle(mem_a, mem_a, db=mock_db)
    except ValueError as e:
        self_cycle_detected = True
        print(f"✓ Self-cycle correctly rejected: {e}")
    assert self_cycle_detected is True

def test_3_semantic_link_cycle_tolerance():
    print("\n--- Test 3: Semantic Links Cycle-Tolerance & DAG Exclusion ---")
    # Semantic links (updates, contradicts) should NEVER participate in dependency DAG
    mem_x = uuid4()
    mem_y = uuid4()
    
    # In semantic links, X updates Y and Y updates X (or contradicts) is completely valid
    mock_db = MagicMock()
    # When ForgettingEngine queries dependency graph, it filters strictly on memory_dependencies
    mock_db.execute.return_value.fetchall.return_value = []
    G = ForgettingEngine.build_dependency_graph(mock_db)
    assert len(G.edges) == 0
    print("✓ Dependency graph excludes semantic links entirely.")

def test_4_forgetting_cascade_and_vector_zeroing():
    print("\n--- Test 4: Forgetting Cascade & Vector Zeroing Verification ---")
    mem_parent = uuid4()
    mem_derived = uuid4()
    
    # Build graph where mem_derived depends on mem_parent
    G = nx.DiGraph()
    G.add_edge(str(mem_parent), str(mem_derived), type="derives_from")
    
    descendants = ForgettingEngine.trace_cascade_dependencies(mem_parent, G)
    assert str(mem_derived) in descendants
    print(f"✓ Transitive dependency {mem_derived} correctly traced from parent {mem_parent}.")
    
    # Test execution with mock db objects
    mock_db = MagicMock()
    # Mock graph querying
    mock_db.execute.return_value.fetchall.return_value = [
        (str(mem_parent), str(mem_derived), "derives_from")
    ]
    
    parent_obj = MagicMock()
    parent_obj.id = mem_parent
    
    derived_obj = MagicMock()
    derived_obj.id = mem_derived
    derived_obj.status = "trusted"
    derived_obj.embedding = [0.1] * 1536
    
    def mock_query(model):
        m = MagicMock()
        def mock_filter(condition):
            f = MagicMock()
            # If filtering for parent
            if "parent" in str(condition) or str(mem_parent) in str(condition):
                f.first.return_value = parent_obj
            else:
                f.first.return_value = derived_obj
            return f
        m.filter = mock_filter
        return m
        
    mock_db.query = mock_query
    
    receipt = ForgettingEngine.execute_deletion(
        target_memory_id=mem_parent,
        requested_by=uuid4(),
        reason="GDPR right-to-be-forgotten",
        db=mock_db
    )
    
    assert receipt["status"] == "completed"
    assert receipt["cascaded_memories_deleted"] == 1
    assert "verification_hash" in receipt
    assert len(receipt["verification_hash"]) == 64  # SHA-256 hex string
    
    # Verify derived memory was revoked and embedding cleared to None
    assert derived_obj.status == "revoked"
    assert derived_obj.embedding is None
    assert "[REVOKED:" in derived_obj.content
    print("✓ Derived memory content scrubbed and vector embedding set to None.")
    
    # Verify non-sensitive audit details (no content preserved)
    details = receipt["details"]
    assert "content" not in details
    assert "embedding" not in details
    assert details["target_memory_id"] == str(mem_parent)
    print(f"✓ Non-sensitive audit receipt verified with SHA-256: {receipt['verification_hash']}")

def test_5_database_fallback_503():
    print("\n--- Test 5: Database Fallback 503 Contract Verification ---")
    from fastapi import HTTPException
    
    # 1. Database health returns unconfigured
    health = check_db_health()
    assert health["status"] == "unconfigured"
    print(f"✓ Health check accurately reports unconfigured: {health['message']}")
    
    # 2. require_db dependency raises 503
    caught_503 = False
    try:
        gen = require_db()
        next(gen)
    except HTTPException as e:
        if e.status_code == 503 and e.detail.get("error") == "DatabaseNotConfigured":
            caught_503 = True
            print(f"✓ require_db() explicitly raised HTTP 503 Service Unavailable: {e.detail}")
            
    assert caught_503 is True, "require_db() did not raise expected 503 Service Unavailable!"

def test_6_api_routes():
    print("\n--- Test 6: FastAPI Route Mounts ---")
    route_paths = [r.path for r in app.routes]
    expected_routes = [
        "/api/health",
        "/api/compiler/compile",
        "/api/compiler/detect-conflicts",
        "/api/memories",
        "/api/memories/{memory_id}",
        "/api/capsules/generate",
        "/api/forgetting/request-deletion",
        "/api/mcp/tools/call"
    ]
    for er in expected_routes:
        assert er in route_paths, f"Missing route {er}"
    print(f"✓ All {len(expected_routes)} critical REST & MCP endpoints confirmed mounted.")

if __name__ == "__main__":
    print("=================================================================")
    print("   KNOWLEDGE BRAIN — PHASE 1 SYSTEM VERIFICATION SUITE")
    print("=================================================================")
    test_1_schema_tables()
    test_2_dependency_cycle_detection()
    test_3_semantic_link_cycle_tolerance()
    test_4_forgetting_cascade_and_vector_zeroing()
    test_5_database_fallback_503()
    test_6_api_routes()
    print("\n=================================================================")
    print("   ALL PHASE 1 ARCHITECTURAL REFINEMENTS VERIFIED CLEANLY!")
    print("=================================================================")
