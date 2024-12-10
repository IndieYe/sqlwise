from enum import Enum

class BaseEnum(Enum):
    """Base enumeration class providing common methods"""
    def __init__(self, value, display_name):
        self._value_ = value
        self.display_name = display_name
    
    @property
    def value(self):
        """Get the status value"""
        return self._value_
    
    @classmethod
    def values(cls):
        """Get a list of all status values"""
        return [item.value for item in cls]
    
    @classmethod
    def names(cls):
        """Get a list of all status names"""
        return [item.display_name for item in cls]
    
    @classmethod
    def get_by_value(cls, value):
        """Get enum value by value"""
        for item in cls:
            if item.value == value:
                return item
        return None
    
    @classmethod
    def get_display_name_by_value(cls, value):
        """Get status name by value"""
        item = cls.get_by_value(value)
        return item.display_name if item else None 