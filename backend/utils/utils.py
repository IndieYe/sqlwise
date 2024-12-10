import json

def extract_json(text: str) -> dict:
    """
    Extract JSON from text
    """
    text = text.strip()
    if text.startswith('```json'):
        return json.loads(text[len('```json'):-len('```')])
    return json.loads(text)

def reverse_relation_type(relation_type: str) -> str:
    """Reverse relation type"""
    return {
        '1-1': '1-1',
        '1-n': 'n-1',
        'n-1': '1-n',
        'n-n': 'n-n'
    }[relation_type]