package vn.odauday.stay.application.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import vn.odauday.stay.domain.audit.model.AuditLogEntity;
import vn.odauday.stay.domain.audit.persistent.AuditLogRepository;
import vn.odauday.stay.domain.booking.model.BookingEntity;
import vn.odauday.stay.domain.booking.persistent.BookingRepository;
import vn.odauday.stay.domain.property.model.PropertyEntity;
import vn.odauday.stay.domain.property.persistent.PropertyRepository;
import vn.odauday.stay.domain.promotion.model.PromotionEntity;
import vn.odauday.stay.domain.promotion.persistent.PromotionRepository;
import vn.odauday.stay.domain.review.model.ReviewEntity;
import vn.odauday.stay.domain.review.persistent.ReviewRepository;
import vn.odauday.stay.domain.room.model.RoomBlockEntity;
import vn.odauday.stay.domain.room.model.RoomEntity;
import vn.odauday.stay.domain.room.persistent.RoomBlockRepository;
import vn.odauday.stay.domain.room.persistent.RoomRepository;
import vn.odauday.stay.domain.user.model.User;
import vn.odauday.stay.domain.user.persistent.UserRepository;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PropertyRepository propertyRepository;
    private final RoomRepository roomRepository;
    private final RoomBlockRepository roomBlockRepository;
    private final BookingRepository bookingRepository;
    private final ReviewRepository reviewRepository;
    private final PromotionRepository promotionRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        try {
            seedAllIfEmpty();
        } catch (Exception e) {
            log.warn("Database initialization skipped or delayed: {}", e.getMessage());
        }
    }

    @Transactional
    public void seedAllIfEmpty() {
        seedUsers();
        seedProperties();
        seedRooms();
        seedRoomBlocks();
        seedBookings();
        seedReviews();
        seedPromotions();
        seedAuditLogs();
    }

    @Transactional
    public void resetAllData() {
        auditLogRepository.deleteAll();
        promotionRepository.deleteAll();
        reviewRepository.deleteAll();
        bookingRepository.deleteAll();
        roomBlockRepository.deleteAll();
        roomRepository.deleteAll();
        propertyRepository.deleteAll();
        userRepository.deleteAll();

        seedAllIfEmpty();
        log.info("Reset and re-seeded all demo data in Oracle database.");
    }

    private void seedUsers() {
        String encodedPassword = passwordEncoder.encode("123");
        List<User> initialUsers = List.of(
            User.builder().username("admin").password(encodedPassword).fullName("Quản trị viên Hệ thống").phone("0900000001").email("admin@odauday.vn").role("ADMIN").status("ACTIVE").build(),
            User.builder().username("host.demo").password(encodedPassword).fullName("Chủ nhà Demo (Nguyễn Văn An)").phone("0900000002").email("host.an@gmail.com").role("HOST").status("ACTIVE").build(),
            User.builder().username("guest.demo").password(encodedPassword).fullName("Khách thuê Demo (Lê Hoàng Nam)").phone("0900000003").email("nam.le@gmail.com").role("GUEST").status("ACTIVE").build(),
            User.builder().username("linh.tran").password(encodedPassword).fullName("Trần Thùy Linh").phone("0912345678").email("linh.tran@gmail.com").role("GUEST").status("ACTIVE").build(),
            User.builder().username("minh.pham").password(encodedPassword).fullName("Phạm Quang Minh (Tài khoản bị khóa)").phone("0900000005").email("minh.pham@gmail.com").role("HOST").status("LOCKED").build()
        );

        for (User u : initialUsers) {
            if (!userRepository.existsByUsername(u.getUsername())) {
                userRepository.save(u);
            }
        }
    }

    private void seedProperties() {
        if (propertyRepository.count() > 0) return;

        List<PropertyEntity> props = List.of(
            PropertyEntity.builder().owner("host.demo").name("ODauDay Stay Hồ Tây").type("Homestay").address("Số 12 ngõ 29 Quảng Bá, Quận Tây Hồ, Hà Nội").city("Hà Nội").area("Hồ Tây").rating(5.0).reviewsCount(24).priceMin(650000.0).desc("Không gian yên tĩnh ven hồ Tây, view hồ thoáng mát, đầy đủ tiện nghi nghỉ dưỡng và bếp nấu riêng biệt.").image("https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80").badge("Yêu thích nhất").amenitiesRaw("Wifi 500M|Sân vườn|Bếp nấu riêng|Smart TV 55 inch|Tự nhận phòng bằng khóa số").status("ACTIVE").build(),
            PropertyEntity.builder().owner("host.demo").name("ODauDay Stay Ba Vì").type("Biệt thự sinh thái").address("Thôn Mái, Yên Bài, Ba Vì, Hà Nội").city("Hà Nội").area("Ba Vì").rating(4.6).reviewsCount(18).priceMin(720000.0).desc("Biệt thự đồi thông trong lành, có bể bơi ngoài trời và sân cỏ BBQ sức chứa lớn cho gia đình.").image("https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80").badge("View núi đồi").amenitiesRaw("Bể bơi|Sân BBQ|Sân cỏ teambuilding|Chỗ đỗ xe ô tô miễn phí").status("ACTIVE").build(),
            PropertyEntity.builder().owner("host.demo").name("ODauDay Stay Cầu Giấy").type("Căn hộ dịch vụ").address("Tòa Central Point, 219 Trung Kính, Cầu Giấy, Hà Nội").city("Hà Nội").area("Cầu Giấy").rating(4.4).reviewsCount(32).priceMin(900000.0).desc("Căn hộ Studio cao cấp ngay trung tâm thương mại, di chuyển thuận tiện tới các trường đại học và phố ẩm thực.").image("https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80").badge("Trung tâm").amenitiesRaw("Smart TV|Smartlock|Thang máy thẻ từ|Máy giặt & sấy").status("ACTIVE").build(),
            PropertyEntity.builder().owner("host.demo").name("ODauDay Stay Sapa Eco").type("Nhà gỗ view thung lũng").address("Bản Tả Van, Thị xã Sa Pa, Lào Cai").city("Lào Cai").area("Sa Pa").rating(4.9).reviewsCount(45).priceMin(1250000.0).desc("Bungalow gỗ pơmu tự nhiên nhìn thẳng ra thung lũng Mường Hoa, săn mây buổi sớm và thưởng thức cà phê ngắm ruộng bậc thang.").image("https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80").badge("Mới ra mắt").amenitiesRaw("View săn mây|Bữa sáng miễn phí|Lò sưởi củi|Hỗ trợ thuê xe máy").status("ACTIVE").build(),
            PropertyEntity.builder().owner("host.demo").name("ODauDay Stay Đà Lạt Mộng Mơ").type("Nhà gỗ đồi thông").address("Đường Khởi Nghĩa Bắc Sơn, Phường 10, TP. Đà Lạt").city("Lâm Đồng").area("Đà Lạt").rating(4.9).reviewsCount(56).priceMin(580000.0).desc("Nhà gỗ nép mình giữa rừng thông cổ thụ, view săn mây và thung lũng đèn lãng mạn buổi tối.").image("https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80").badge("Săn mây").amenitiesRaw("Sân nướng BBQ|Lò sưởi củi|View đồi thông|Bữa sáng bản địa").status("ACTIVE").build(),
            PropertyEntity.builder().owner("host.demo").name("ODauDay Stay Phố Cổ Heritage").type("Căn hộ Indochine").address("Số 18 Hàng Vôi, Phường Lý Thái Tổ, Hoàn Kiếm, Hà Nội").city("Hà Nội").area("Phố Cổ").rating(4.8).reviewsCount(38).priceMin(850000.0).desc("Không gian kiến trúc Pháp cổ giao tọa nét văn hóa Tràng An, đi bộ 3 phút tới Hồ Hoàn Kiếm.").image("https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80").badge("Trung tâm phố cổ").amenitiesRaw("Đi bộ ra Hồ Gươm|Ban công cổ kính|Smartlock|Máy giặt & sấy").status("ACTIVE").build(),
            PropertyEntity.builder().owner("host.demo").name("ODauDay Stay Tam Đảo Mây Ngàn").type("Biệt thự sinh thái").address("Khu 1, Thị trấn Tam Đảo, Vĩnh Phúc").city("Vĩnh Phúc").area("Tam Đảo").rating(4.7).reviewsCount(29).priceMin(1100000.0).desc("Villa đồi cao nhìn trọn cảnh biển mây Tam Đảo, trang bị bể bơi vô cực nước ấm và sân thượng BBQ.").image("https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80").badge("Bể bơi vô cực").amenitiesRaw("Bể bơi nước ấm|Sân BBQ hoàng hôn|Khu vui chơi trẻ em|Karaoke gia đình").status("ACTIVE").build(),
            PropertyEntity.builder().owner("host.demo").name("ODauDay Stay Ninh Bình Mountain").type("Bungalow ven hồ").address("Thôn Tràng An, Xã Trường Yên, Hoa Lư, Ninh Bình").city("Ninh Bình").area("Tràng An").rating(5.0).reviewsCount(42).priceMin(680000.0).desc("Bungalow mái cọ giữa hồ sen ngắm núi đá vôi sừng sững, trải nghiệm chèo thuyền kayak miễn phí.").image("https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=1200&q=80").badge("Gần di sản Tràng An").amenitiesRaw("Thuyền Kayak miễn phí|Xe đạp dạo hồ|Bữa sáng phục vụ tận phòng|Câu cá giải trí").status("ACTIVE").build(),
            PropertyEntity.builder().owner("host.demo").name("ODauDay Stay Hội An Riverside").type("Nhà vườn truyền thống").address("Số 54 Nguyễn Tri Phương, Cẩm Nam, Hội An, Quảng Nam").city("Quảng Nam").area("Hội An").rating(4.9).reviewsCount(63).priceMin(750000.0).desc("Nhà cổ ngói âm dương bên bờ sông Hoài hiền hòa, cách phố cổ đèn lồng chỉ 500m tản bộ.").image("https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=1200&q=80").badge("Ven sông Hoài").amenitiesRaw("Hồ bơi sân vườn|Đạp xe phố cổ|Tiệc trà chiều|Bữa sáng đặc sản Hội An").status("ACTIVE").build(),
            PropertyEntity.builder().owner("host.demo").name("ODauDay Stay Phú Quốc Sunset").type("Villa sát biển").address("Đường Trần Hưng Đạo, Dương Tơ, TP. Phú Quốc, Kiên Giang").city("Kiên Giang").area("Phú Quốc").rating(4.8).reviewsCount(51).priceMin(1450000.0).desc("Biệt thự bờ biển ngắm trọn hoàng hôn Bãi Trường, bước vài bước chân chạm ngay cát trắng và sóng biển.").image("https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80").badge("Sát biển Bãi Trường").amenitiesRaw("Bãi biển riêng|Hồ bơi hướng biển|Quầy bar ngoài trời|Đưa đón sân bay").status("ACTIVE").build(),
            PropertyEntity.builder().owner("host.demo").name("ODauDay Stay Hạ Long Bay View").type("Căn hộ dịch vụ").address("Tòa Green Bay Premium, Hoàng Quốc Việt, Bãi Cháy, Quảng Ninh").city("Quảng Ninh").area("Hạ Long").rating(4.7).reviewsCount(34).priceMin(950000.0).desc("Căn hộ cao cấp tầng 22 phóng tầm mắt bao trọn vịnh Hạ Long kỳ vĩ, đi bộ ra bãi tắm Bãi Cháy.").image("https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80").badge("View vịnh Hạ Long").amenitiesRaw("View vịnh 180 độ|Bể bơi bốn mùa|Bếp hiện đại|Cạnh chợ đêm hải sản").status("ACTIVE").build(),
            PropertyEntity.builder().owner("host.demo").name("ODauDay Stay Vũng Tàu Ocean").type("Căn hộ view biển").address("Số 02 Lê Lợi, Phường 1, TP. Vũng Tàu, Bà Rịa - Vũng Tàu").city("Bà Rịa - Vũng Tàu").area("Vũng Tàu").rating(4.6).reviewsCount(27).priceMin(820000.0).desc("Căn hộ ban công lộng gió Bãi Trước, nội thất hiện đại tông màu xanh biển sảng khoái và yên tĩnh.").image("https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80").badge("Gần Bãi Trước").amenitiesRaw("Đi bộ 2 phút ra biển|Bếp nướng hải sản|Chỗ đỗ xe ô tô|Smart TV 65 inch").status("ACTIVE").build(),
            PropertyEntity.builder().owner("host.demo").name("ODauDay Stay Huế Cố Đô").type("Homestay nhà vườn").address("Số 11 thôn Lại Thế, Xã Phú Thượng, Huyện Phú Vang, Thừa Thiên Huế").city("Thừa Thiên Huế").area("Huế").rating(4.9).reviewsCount(31).priceMin(520000.0).desc("Nhà rường truyền thống xứ Huế giữa vườn thanh trà râm mát, đắm chìm trong vẻ đẹp thơ mộng sông Hương.").image("https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80").badge("Văn hóa Cố Đô").amenitiesRaw("Thưởng trà cung đình|Vườn hoa trái xanh mát|Bếp nấu truyền thống|Thuê áo dài chụp ảnh").status("ACTIVE").build(),
            PropertyEntity.builder().owner("host.demo").name("ODauDay Stay Quy Nhơn Sea").type("Bungalow biển").address("Bãi Xép, Phường Ghềnh Ráng, TP. Quy Nhơn, Bình Định").city("Bình Định").area("Quy Nhơn").rating(4.8).reviewsCount(22).priceMin(890000.0).desc("Bungalow vách đá nhìn xuống làng chài bình yên Bãi Xép, ngắm bình minh đại dương rực rỡ từ giường ngủ.").image("https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80").badge("View làng chài Bãi Xép").amenitiesRaw("Ngắm bình minh biển|Hải sản tươi sống làng chài|Lặn ngắm san hô|Võng thư giãn").status("ACTIVE").build()
        );

        propertyRepository.saveAll(props);
        log.info("Seeded {} properties into Oracle DB.", props.size());
    }

    private void seedRooms() {
        if (roomRepository.count() > 0) return;

        List<RoomEntity> rooms = List.of(
            RoomEntity.builder().propertyId(1L).propertyName("ODauDay Stay Hồ Tây").name("Phòng Garden").capacity(2).price(650000.0).weekendPrice(750000.0).desc("1 giường đôi Queen · View vườn xanh mát · Bếp nấu mini · Điều hòa 2 chiều").status("ACTIVE").build(),
            RoomEntity.builder().propertyId(1L).propertyName("ODauDay Stay Hồ Tây").name("Phòng Family").capacity(4).price(1100000.0).weekendPrice(1300000.0).desc("2 giường King · Ban công lớn nhìn ra hồ · Phòng tắm kính tiện nghi").status("ACTIVE").build(),
            RoomEntity.builder().propertyId(2L).propertyName("ODauDay Stay Ba Vì").name("Villa Rừng Thông").capacity(8).price(2500000.0).weekendPrice(3200000.0).desc("3 phòng ngủ riêng biệt · Bếp nướng BBQ · Hồ bơi riêng ngoài trời").status("ACTIVE").build(),
            RoomEntity.builder().propertyId(3L).propertyName("ODauDay Stay Cầu Giấy").name("Studio Deluxe").capacity(2).price(900000.0).weekendPrice(950000.0).desc("1 giường Queen · View thành phố tầng cao · Bàn làm việc cao cấp").status("ACTIVE").build()
        );

        roomRepository.saveAll(rooms);
        log.info("Seeded {} rooms into Oracle DB.", rooms.size());
    }

    private void seedRoomBlocks() {
        if (roomBlockRepository.count() > 0) return;

        List<RoomBlockEntity> blocks = List.of(
            RoomBlockEntity.builder().roomId(2L).roomName("Phòng Family").start("2027-02-10").end("2027-02-12").reason("Bảo trì hệ thống điều hòa và sơn mới ban công").build()
        );

        roomBlockRepository.saveAll(blocks);
        log.info("Seeded {} room blocks into Oracle DB.", blocks.size());
    }

    private void seedBookings() {
        if (bookingRepository.count() > 0) return;

        List<BookingEntity> bookings = List.of(
            BookingEntity.builder().code("ODD-DEMO-0001").guestUsername("guest.demo").guestName("Khách thuê Demo (Lê Hoàng Nam)").guestPhone("0900000003").guestEmail("nam.le@gmail.com").propertyId(1L).propertyName("ODauDay Stay Hồ Tây").roomId(1L).roomName("Phòng Garden").checkIn("2027-01-10").checkOut("2027-01-12").nights(2).guests(2).pricePerNight(650000.0).subtotal(1300000.0).serviceFee(0.0).total(1300000.0).status("COMPLETED").createdAt("2026-12-20").isReviewed(true).build(),
            BookingEntity.builder().code("ODD-DEMO-0002").guestUsername("guest.demo").guestName("Khách thuê Demo (Lê Hoàng Nam)").guestPhone("0900000003").guestEmail("nam.le@gmail.com").propertyId(1L).propertyName("ODauDay Stay Hồ Tây").roomId(1L).roomName("Phòng Garden").checkIn("2027-02-20").checkOut("2027-02-22").nights(2).guests(2).pricePerNight(650000.0).subtotal(1300000.0).serviceFee(0.0).total(1300000.0).status("PENDING").createdAt("2027-01-02").isReviewed(false).build(),
            BookingEntity.builder().code("ODD-DEMO-0003").guestUsername("guest.demo").guestName("Khách thuê Demo (Lê Hoàng Nam)").guestPhone("0900000003").guestEmail("nam.le@gmail.com").propertyId(1L).propertyName("ODauDay Stay Hồ Tây").roomId(1L).roomName("Phòng Garden").checkIn("2027-03-01").checkOut("2027-03-04").nights(3).guests(2).pricePerNight(650000.0).subtotal(1950000.0).serviceFee(0.0).total(1950000.0).status("CHECKED_IN").createdAt("2027-01-01").isReviewed(false).build(),
            BookingEntity.builder().code("ODD-DEMO-0004").guestUsername("linh.tran").guestName("Trần Thùy Linh").guestPhone("0912345678").guestEmail("linh.tran@gmail.com").propertyId(1L).propertyName("ODauDay Stay Hồ Tây").roomId(2L).roomName("Phòng Family").checkIn("2027-01-20").checkOut("2027-01-22").nights(2).guests(4).pricePerNight(1100000.0).subtotal(2200000.0).serviceFee(0.0).total(2200000.0).status("CONFIRMED").createdAt("2027-01-15").isReviewed(false).build()
        );

        bookingRepository.saveAll(bookings);
        log.info("Seeded {} bookings into Oracle DB.", bookings.size());
    }

    private void seedReviews() {
        if (reviewRepository.count() > 0) return;

        List<ReviewEntity> reviews = List.of(
            ReviewEntity.builder().bookingCode("ODD-DEMO-0001").propertyId(1L).guestUsername("guest.demo").guestName("Khách thuê Demo").rating(5).comment("Phòng sạch sẽ, không gian thoáng đãng mát mẻ, chủ nhà hỗ trợ check-in rất nhanh chóng và nhiệt tình. Vị trí đi bộ ra hồ Tây rất gần!").date("13/01/2027").build()
        );

        reviewRepository.saveAll(reviews);
        log.info("Seeded {} reviews into Oracle DB.", reviews.size());
    }

    private void seedPromotions() {
        if (promotionRepository.count() > 0) return;

        List<PromotionEntity> promos = List.of(
            PromotionEntity.builder().code("ODAUDAY10").type("PERCENT").value(10.0).maxDiscount(200000.0).minOrder(500000.0).usageLimit(100).usedCount(18).validFrom("2026-01-01").validTo("2027-12-31").status("ACTIVE").build(),
            PromotionEntity.builder().code("CHAOHE2027").type("FIXED").value(150000.0).minOrder(1000000.0).usageLimit(50).usedCount(12).validFrom("2027-05-01").validTo("2027-08-31").status("ACTIVE").build(),
            PromotionEntity.builder().code("VIPTRAVEL").type("PERCENT").value(20.0).maxDiscount(500000.0).minOrder(2000000.0).usageLimit(30).usedCount(30).validFrom("2027-01-01").validTo("2027-06-30").status("INACTIVE").build(),
            PromotionEntity.builder().code("WELCOME50K").type("FIXED").value(50000.0).minOrder(300000.0).usageLimit(200).usedCount(45).validFrom("2026-01-01").validTo("2027-12-31").status("ACTIVE").build()
        );

        promotionRepository.saveAll(promos);
        log.info("Seeded {} promotions into Oracle DB.", promos.size());
    }

    private void seedAuditLogs() {
        if (auditLogRepository.count() > 0) return;

        List<AuditLogEntity> logs = List.of(
            AuditLogEntity.builder().action("LOCK").target("minh.pham").details("Khóa tài khoản do vi phạm chính sách tiếp đón khách").performedBy("admin").timestamp("2027-01-15 14:30:22").build(),
            AuditLogEntity.builder().action("CHANGE_ROLE").target("host.demo").details("Phê duyệt nâng cấp vai trò từ GUEST sang HOST").performedBy("admin").timestamp("2027-01-10 09:15:00").build(),
            AuditLogEntity.builder().action("CREATE_PROMO").target("CHAOHE2027").details("Phát hành chiến dịch voucher mùa hè toàn sàn").performedBy("admin").timestamp("2027-01-05 11:20:45").build(),
            AuditLogEntity.builder().action("TOGGLE_PROPERTY").target("ODauDay Stay Hồ Tây").details("Kiểm duyệt chất lượng và xác thực cơ sở lưu trú đạt chuẩn").performedBy("admin").timestamp("2027-01-02 16:45:10").build()
        );

        auditLogRepository.saveAll(logs);
        log.info("Seeded {} audit logs into Oracle DB.", logs.size());
    }
}
