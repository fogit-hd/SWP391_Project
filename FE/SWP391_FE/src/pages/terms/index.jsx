import React from "react";
import { Link } from "react-router-dom";
import { Button, Card, Typography, Divider, List, Alert } from "antd";
import "./terms.css";

const { Title, Paragraph, Text } = Typography;

function TermsPage() {
  return (
    <div className="terms-page">
      <div
        className="terms-content"
        style={{
          minHeight: "calc(100vh - 64px - 200px)",
          padding: "40px 20px",
        }}
      >
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <Card>
            <Title level={1}>EV Co-ownership & Cost-sharing System</Title>
            <Paragraph style={{ fontSize: "16px", color: "#666" }}>
              Phần mềm quản lý đồng sở hữu & chia sẻ chi phí xe điện
            </Paragraph>

            <Alert
              message="Important Notice"
              description="By registering, you agree to all terms and conditions outlined below. Please read carefully before proceeding."
              type="warning"
              showIcon
              style={{ marginBottom: "30px" }}
            />

            <Title level={2}>I. TỔNG QUAN HỆ THỐNG</Title>
            <Paragraph>
              <strong>Mục tiêu:</strong> Xây dựng nền tảng quản lý đồng sở hữu
              xe điện giúp nhiều người cùng sở hữu và sử dụng xe một cách công
              bằng, minh bạch và hiệu quả.
            </Paragraph>

            <Title level={3}>Đối tượng sử dụng:</Title>
            <List
              dataSource={[
                "Co-owner (Đồng chủ sở hữu)",
                "Staff (Nhân viên vận hành)",
                "Admin (Quản trị viên hệ thống)",
              ]}
              renderItem={(item) => <List.Item>• {item}</List.Item>}
            />

            <Divider />

            <Title level={2}>II. QUYỀN VÀ NGHĨA VỤ CO-OWNER</Title>

            <Title level={3}>A. Đăng ký & Xác thực</Title>
            <List
              dataSource={[
                "Mỗi co-owner phải cung cấp CMND/CCCD hợp lệ và chưa hết hạn",
                "Giấy phép lái xe phải phù hợp với loại xe đăng ký (B1, B2)",
                "Tuổi tối thiểu: 18 tuổi cho ô tô điện",
              ]}
              renderItem={(item) => <List.Item>• {item}</List.Item>}
            />

            <Title level={3}>B. Quản lý tỷ lệ sở hữu</Title>
            <List
              dataSource={[
                "Tổng tỷ lệ sở hữu trong nhóm = 100%",
                "Tỷ lệ sở hữu tối thiểu: 10% để tham gia nhóm",
                "Tỷ lệ sở hữu tối đa: 70% cho một cá nhân",
                "Việc chuyển nhượng tỷ lệ sở hữu phải qua hợp đồng pháp lý",
              ]}
              renderItem={(item) => <List.Item>• {item}</List.Item>}
            />

            <Title level={3}>C. Đặt lịch & Sử dụng xe</Title>
            <List
              dataSource={[
                "Đặt lịch trước tối thiểu 2 giờ, tối đa 14 ngày",
                "Lịch đặt xe phải cách nhau tối thiểu 30 phút để sạc điện",
                "Mỗi co-owner được đặt xe tối đa 8 giờ/1 ngày",
                "Mỗi co-owner có hạn ngạch sử dụng xe tối đa trong tháng",
                "Ưu tiên dựa trên tỷ lệ sở hữu",
                "Check-in đúng giờ, chậm > 15 phút tự động huỷ lịch",
                "Check-out trong vòng 15 phút sau khi kết thúc sử dụng",
              ]}
              renderItem={(item) => <List.Item>• {item}</List.Item>}
            />

            <Title level={3}>D. Quy định phạt vi phạm</Title>
            <List
              dataSource={[
                "Huỷ lịch trong 30 phút trước check-in: phạt hạn ngạch trừ theo nửa số giờ đã đặt",
                "Chậm check-out > 30 phút: phạt thời gian sử dụng x2",
                "Chậm check-out > 60 phút: phạt thời gian sử dụng 2 ngày",
                "Chậm check-out > 180 phút: phạt thời gian sử dụng 1 tuần, trừ 1 điểm uy tín",
                "Không check-in/out: cấm sử dụng 7 ngày",
              ]}
              renderItem={(item) => <List.Item>• {item}</List.Item>}
            />

            <Divider />

            <Title level={2}>III. CHI PHÍ & THANH TOÁN</Title>

            <Title level={3}>A. Phân chia chi phí</Title>
            <List
              dataSource={[
                "Chi phí dịch vụ (bảo dưỡng, sửa chữa, vệ sinh) chỉ được thực hiện khi 100% Co-owner phê duyệt",
                "Phí sạc điện do người sử dụng xe trực tiếp thanh toán tại điểm sạc",
                "Chi phí hư hỏng/tai nạn/vi phạm giao thông do Co-owner gây ra sẽ gán trực tiếp cho cá nhân đó",
                "Phí quản lý nền tảng = 5-10% giá trị dịch vụ, thu từ đối tác dịch vụ",
              ]}
              renderItem={(item) => <List.Item>• {item}</List.Item>}
            />

            <Title level={3}>B. Thanh toán</Title>
            <List
              dataSource={[
                "Hệ thống xuất hóa đơn điện tử (e-invoice) cho Co-owner",
                "Thanh toán qua ngân hàng hoặc ví điện tử bên ngoài hệ thống",
                "Nếu không thanh toán: quyền đặt dịch vụ bị chặn, tài khoản trạng thái 'Unpaid'",
                "Quá hạn thanh toán 30 ngày: loại khỏi nhóm đồng sở hữu",
              ]}
              renderItem={(item) => <List.Item>• {item}</List.Item>}
            />

            <Divider />

            <Title level={2}>IV. NHÓM ĐỒNG SỞ HỮU</Title>

            <Title level={3}>A. Quản lý nhóm</Title>
            <List
              dataSource={[
                "Nhóm tối thiểu 2 người, tối đa 8 người",
                "Có 1 admin nhóm (thường là người có tỷ lệ sở hữu cao nhất)",
                "Admin nhóm có thể mời/xóa thành viên với sự đồng ý ≥ 60% nhóm",
                "Thành viên có thể tự rời nhóm với thông báo trước 30 ngày",
                "Khi rời nhóm, phải thanh toán hết các khoản nợ",
              ]}
              renderItem={(item) => <List.Item>• {item}</List.Item>}
            />

            <Title level={3}>B. Quyết định chung</Title>
            <List
              dataSource={[
                "Các quyết định lớn cần bỏ phiếu: nâng cấp xe, bán xe, thay đổi quy định",
                "Quyết định thông qua khi có ≥ 75% phiếu đồng ý (tính theo tỷ lệ sở hữu)",
                "Thời gian bỏ phiếu: 7 ngày, gia hạn tối đa 3 ngày",
                "Không tham gia bỏ phiếu = không đồng ý",
                "Kết quả bỏ phiếu công khai cho tất cả thành viên",
              ]}
              renderItem={(item) => <List.Item>• {item}</List.Item>}
            />

            <Divider />

            <Title level={2}>V. BẢO MẬT & AN TOÀN</Title>
            <List
              dataSource={[
                "Mã hóa tất cả dữ liệu nhạy cảm (thông tin cá nhân, tài chính)",
                "Xác thực 2 lớp (2FA) bắt buộc cho tất cả tài khoản",
                "Backup dữ liệu hàng ngày, lưu trữ tại 2 địa điểm khác nhau",
                "Log tất cả hoạt động quan trọng trong hệ thống",
                "Tuân thủ quy định bảo vệ dữ liệu cá nhân (GDPR, PDPA)",
              ]}
              renderItem={(item) => <List.Item>• {item}</List.Item>}
            />

            <Divider />

            <Title level={2}>VI. TUÂN THỦ PHÁP LUẬT</Title>
            <List
              dataSource={[
                "Tuân thủ luật giao thông và quy định về xe điện",
                "Đăng ký kinh doanh và nộp thuế theo quy định",
                "Bảo hiểm trách nhiệm dân sự cho hoạt động kinh doanh",
                "Báo cáo định kỳ cho cơ quan quản lý giao thông",
                "Hợp tác với cơ quan pháp luật khi có yêu cầu",
              ]}
              renderItem={(item) => <List.Item>• {item}</List.Item>}
            />

            <Alert
              message="Lưu ý quan trọng"
              description="Hệ thống hoạt động 99.5% thời gian với thời gian phản hồi trung bình < 2 giây. Hỗ trợ đa nền tảng: web, iOS, Android."
              type="info"
              style={{ marginTop: "30px" }}
            />

            <div style={{ marginTop: "30px", textAlign: "center" }}>
              <Button type="primary" size="large">
                <Link to="/register">Tôi đồng ý - Tiếp tục đăng ký</Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default TermsPage;
