import json
from services.gemini_service import GeminiService

def test_counting():
    service = GeminiService()
    
    # Test Kanban empty
    data_kanban_empty = {"backlog": [], "inProgress": [], "done": []}
    count = service._count_total_tasks("kanban", data_kanban_empty)
    print(f"Kanban count (empty): {count}") # Expected: 0
    
    # Test Kanban with 2 tasks
    data_kanban_2 = {"backlog": [{"title": "T1"}], "inProgress": [{"title": "T2"}], "done": []}
    count = service._count_total_tasks("kanban", data_kanban_2)
    print(f"Kanban count (2 tasks): {count}") # Expected: 2
    
    # Test GTD with projects
    data_gtd = {
        "nextActions": [{"title": "NA1"}],
        "projects": [
            {"name": "P1", "tasks": [{"title": "PT1"}, {"title": "PT2"}]}
        ]
    }
    count = service._count_total_tasks("gtd", data_gtd)
    print(f"GTD count: {count}") # Expected: 3

def test_injection():
    service = GeminiService()
    
    # Test Injection for Kanban
    data = {"backlog": []}
    service._inject_fallback_tasks("kanban", data, 3)
    print(f"Kanban injected: {json.dumps(data, indent=2)}")
    assert len(data["backlog"]) == 3
    
    # Test Injection for Pomodoro
    data_pom = {"tasks": []}
    service._inject_fallback_tasks("pomodoro", data_pom, 2)
    print(f"Pomodoro injected: {json.dumps(data_pom, indent=2)}")
    assert len(data_pom["tasks"]) == 2

if __name__ == "__main__":
    test_counting()
    test_injection()
    print("Tests completed!")
