from datetime import datetime, timezone
from database import db
from sqlalchemy import event

class BaseModel(db.Model):
    """Base model class, containing common fields"""
    __abstract__ = True
    
    id = db.Column(db.Integer, primary_key=True)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), nullable=False)
    version = db.Column(db.Integer, nullable=False, default=0)

    # Define fields that should not be updated
    do_not_update_fields = {'created_at', 'updated_at', 'version'}

    def update(self, **kwargs):
        """Smart update properties, excluding specified fields"""
        self.version += 1
        for key, value in kwargs.items():
            if key not in self.do_not_update_fields:
                setattr(self, key, value)
        return self

# Add SQLAlchemy event listener
@event.listens_for(BaseModel, 'before_insert', propagate=True)
def set_created_updated_at(mapper, connection, target):
    """Set creation and update times before insertion"""
    now = datetime.now(timezone.utc)
    target.created_at = now
    target.updated_at = now

@event.listens_for(BaseModel, 'before_update', propagate=True)
def set_updated_at(mapper, connection, target):
    """Set update time before update"""
    target.updated_at = datetime.now(timezone.utc)

class ProjectBaseModel(BaseModel):
    """Project base model class"""
    __abstract__ = True
    
    project_id = db.Column(db.Integer, nullable=False)