/**
 * TOÀN BỘ dữ liệu CV — sửa thông tin cá nhân tại file này, không cần đụng layout.
 *
 * Quy ước:
 * - Section nào bỏ trống ([] hoặc "") sẽ tự ẩn khỏi trang CV.
 * - `labels` = tiêu đề các section — đổi ngôn ngữ CV tại đây.
 * - Toàn bộ nội dung dưới đây là MOCK DATA, chờ resume thật thay thế.
 */
module.exports = {
  meta: {
    name: "NGUYEN DUC ANH KHOI",
    jobTitle: "Senior Software Engineer",
    contacts: [
      "Hồ Chí Minh, Việt Nam",
      "+84 9xx xxx xxx",
      "khoi@example.com",
      "github.com/ndanhkhoi",
      "linkedin.com/in/ndanhkhoi"
    ]
  },

  labels: {
    summary: "Hồ sơ nghề nghiệp",
    experience: "Kinh nghiệm làm việc",
    projects: "Dự án tiêu biểu",
    skills: "Kỹ năng",
    education: "Học vấn",
    certifications: "Chứng chỉ",
    additional: "Thông tin bổ sung",
    languages: "Ngoại ngữ",
    interests: "Sở thích"
  },

  summary:
    "Kỹ sư phần mềm với hơn 7 năm kinh nghiệm xây dựng ứng dụng web full-stack " +
    "(.NET, React/TypeScript) trong lĩnh vực y tế. Thành thạo thiết kế hệ thống " +
    "form/in ấn chuẩn hóa, tối ưu quy trình nghiệp vụ. Tư duy hướng dữ liệu, " +
    "thích làm việc trực tiếp với khách hàng để đưa giải pháp kỹ thuật đi đúng bài toán.",

  experience: [
    {
      position: "Senior Software Engineer",
      company: "Delta Tech Solutions",
      location: "Hồ Chí Minh",
      period: "01/2022 — nay",
      highlights: [
        "Dẫn dắt nhóm 5 người phát triển hệ thống quản lý bệnh án điện tử (HIS) phục vụ 20+ cơ sở y tế.",
        "Thiết kế bộ khung in ấn HTML→PDF chuẩn A4 cho 40+ mẫu phiếu bệnh án, giảm 60% thời gian phát hành mẫu mới.",
        "Refactor kiến trúc front-end từ jQuery monolith sang React + TypeScript, giảm 40% lỗi regression."
      ]
    },
    {
      position: "Full-stack Developer",
      company: "Nova Healthcare Systems",
      location: "Hồ Chí Minh",
      period: "06/2018 — 12/2021",
      highlights: [
        "Phát triển module quản lý thuốc & kê đơn điện tử tích hợp BHYT, xử lý 10.000+ giao dịch/ngày.",
        "Xây dựng công cụ preview phiếu in HTML khổ A4 với đánh số trang tự động, thay thế giải pháp Word template.",
        "Đào tạo nội bộ về quy chuẩn thiết kế form in và review code."
      ]
    },
    {
      position: "Software Engineer",
      company: "ABC Software",
      location: "Cần Thơ",
      period: "07/2016 — 05/2018",
      highlights: [
        "Phát triển ứng dụng quản lý phòng khám bằng WPF + SQL Server cho 30+ phòng mạch tư.",
        "Tự động hóa quy trình sao lưu và báo cáo định kỳ, tiết kiệm 8 giờ vận hành/tháng."
      ]
    }
  ],

  projects: [
    {
      name: "Bộ khung in ấn HTML chuẩn A4",
      link: "",
      tech: ["HTML/CSS print", "Paged.js", "Freemarker"],
      description:
        "Bộ chuẩn + công cụ preview khiến mẫu phiếu in HTML hiển thị đúng khổ A4 kèm số trang, " +
        "in PDF 1:1 với preview cho hàng chục mẫu biểu nội bộ."
    },
    {
      name: "Patient Portal",
      link: "",
      tech: ["React", "TypeScript", "Node.js"],
      description:
        "Cổng thông tin bệnh nhân: đặt lịch hẹn, xem kết quả xét nghiệm, thanh toán online. " +
        "Tích hợp SSO với ứng dụng HIS nội bộ."
    },
    {
      name: "DevResume CV",
      link: "https://github.com/ndanhkhoi/ndanhkhoi.github.io",
      tech: ["Eleventy", "Nunjucks", "CSS print"],
      description:
        "Trang CV cá nhân print-first: dữ liệu tách riêng, build tĩnh, deploy GitHub Pages, " +
        "Ctrl+P ra PDF A4 chuẩn."
    }
  ],

  skills: [
    { label: "Ngôn ngữ", items: ["C#", "TypeScript", "JavaScript", "SQL", "Python"] },
    { label: "Front-end", items: ["React", "WPF", "HTML/CSS print", "Paged.js"] },
    { label: "Back-end", items: [".NET", "Node.js", "REST API", "FreeMarker"] },
    { label: "CSDL & DevOps", items: ["SQL Server", "PostgreSQL", "Redis", "Docker", "GitHub Actions"] }
  ],

  education: [
    {
      degree: "Kỹ sư Công nghệ Thông tin",
      school: "Đại học Bách Khoa — ĐHQG TP.HCM",
      period: "2012 — 2016",
      detail: "Tốt nghiệp loại Khá. Đồ án: ứng dụng quản lý bệnh viện trên nền web."
    }
  ],

  certifications: [
    { name: "AWS Certified Developer — Associate", extra: "Amazon Web Services, 2024" },
    { name: "CKA: Certified Kubernetes Administrator", extra: "CNCF, 2023" }
  ],

  languages: [
    { name: "Tiếng Việt", note: "Bản ngữ" },
    { name: "Tiếng Anh", note: "TOEIC 850 — đọc hiểu tài liệu tốt" }
  ],

  interests: ["Nghiên cứu print CSS & typography", "Chạy bộ", "Nhạc acoustic"]
};
