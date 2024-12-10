from dataclasses import dataclass
from datetime import datetime

@dataclass
class JobDTO:
    id: int
    version: int
    task_id: int
    project_id: int
    job_type: str
    job_data: dict
    job_status: str
    job_type_display_name: str
    job_status_display_name: str
    error_message: str
    created_at: datetime
    updated_at: datetime
    job_cost_time: int