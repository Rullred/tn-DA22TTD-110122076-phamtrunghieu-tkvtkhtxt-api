#!/usr/bin/env python3
"""
Fix seed data to properly retrieve sinh_vien IDs
"""

import re

# Read the file
with open('iam-service/src/main/resources/db/migration/V3__seed_data.sql', 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern for student insertion - add RETURNING id INTO after sinh_vien INSERT
pattern = r'(INSERT INTO sinh_vien \(nguoi_dung_id, ma_sinh_vien,.*?\)[\s\n]+VALUES \(v_s_(\d+),.*?\));'

def replace_student_insert(match):
    original = match.group(1)
    student_id = match.group(2)
    # Add RETURNING clause to get sinh_vien.id (not nguoi_dung.id)
    return original + f'\n    SELECT id INTO v_s_{student_id} FROM sinh_vien WHERE nguoi_dung_id = v_s_{student_id};'

# Apply the replacement
content_fixed = re.sub(pattern, replace_student_insert, content, flags=re.DOTALL)

# Write back
with open('iam-service/src/main/resources/db/migration/V3__seed_data.sql', 'w', encoding='utf-8') as f:
    f.write(content_fixed)

print("Fixed seed data script!")
