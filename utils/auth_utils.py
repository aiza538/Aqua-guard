import re

def is_valid_phone(phone):
    pattern = r'^03\d{9}$'
    return re.match(pattern, phone) is not None

def is_valid_password(password):
    return len(password) >= 4