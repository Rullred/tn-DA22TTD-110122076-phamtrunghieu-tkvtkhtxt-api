-- Cập nhật email của tài khoản admin
UPDATE nguoi_dung 
SET email = 'phamtrunghieudhi1301@gmail.com',
    ngay_cap_nhat = CURRENT_TIMESTAMP
WHERE ten_dang_nhap = 'admin';

-- Kiểm tra kết quả
SELECT id, ten_dang_nhap, email, vai_tro, ngay_cap_nhat 
FROM nguoi_dung 
WHERE ten_dang_nhap = 'admin';
