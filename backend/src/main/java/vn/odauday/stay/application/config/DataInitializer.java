package vn.odauday.stay.application.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
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

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true")
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

    @Value("${app.seed.password:}")
    private String seedPassword;

    @Override
    @Transactional
    public void run(String... args) {
        seedAllIfEmpty();
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

    /** Ngày mẫu tính theo hôm nay (yyyy-MM-dd), để dữ liệu demo luôn hợp lý dù chạy vào lúc nào. */
    private static String day(int offsetDays) {
        return LocalDate.now().plusDays(offsetDays).format(DateTimeFormatter.ISO_LOCAL_DATE);
    }

    /** Cùng ngày nhưng theo định dạng dd/MM/yyyy dùng cho đánh giá. */
    private static String viDay(int offsetDays) {
        return LocalDate.now().plusDays(offsetDays).format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
    }

    private void seedUsers() {
        if (seedPassword == null || seedPassword.isBlank()) {
            throw new IllegalStateException(
                    "app.seed.enabled=true nhưng thiếu app.seed.password (biến môi trường APP_SEED_PASSWORD)");
        }
        String encodedPassword = passwordEncoder.encode(seedPassword);
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
            PropertyEntity.builder().owner("host.demo").name("ODauDay Stay Hồ Tây").type("Homestay").address("Số 12 ngõ 29 Quảng Bá, Quận Tây Hồ, Hà Nội").city("Hà Nội").area("Hồ Tây").rating(5.0).reviewsCount(1).priceMin(650000.0).desc("Không gian yên tĩnh ven hồ Tây, view hồ thoáng mát, đầy đủ tiện nghi nghỉ dưỡng và bếp nấu riêng biệt.").image("https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80").badge("Yêu thích nhất").amenitiesRaw("Wifi 500M|Sân vườn|Bếp nấu riêng|Smart TV 55 inch|Tự nhận phòng bằng khóa số").status("ACTIVE").isHot(true).views7d(1450L).build(),
            PropertyEntity.builder().owner("host.demo").name("ODauDay Stay Ba Vì").type("Biệt thự sinh thái").address("Thôn Mái, Yên Bài, Ba Vì, Hà Nội").city("Hà Nội").area("Ba Vì").rating(null).reviewsCount(0).priceMin(720000.0).desc("Biệt thự đồi thông trong lành, có bể bơi ngoài trời và sân cỏ BBQ sức chứa lớn cho gia đình.").image("https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80").badge("View núi đồi").amenitiesRaw("Bể bơi|Sân BBQ|Sân cỏ teambuilding|Chỗ đỗ xe ô tô miễn phí").status("ACTIVE").isHot(false).views7d(980L).build(),
            PropertyEntity.builder().owner("host.demo").name("ODauDay Stay Cầu Giấy").type("Căn hộ dịch vụ").address("Tòa Central Point, 219 Trung Kính, Cầu Giấy, Hà Nội").city("Hà Nội").area("Cầu Giấy").rating(null).reviewsCount(0).priceMin(900000.0).desc("Căn hộ Studio cao cấp ngay trung tâm thương mại, di chuyển thuận tiện tới các trường đại học và phố ẩm thực.").image("https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80").badge("Trung tâm").amenitiesRaw("Smart TV|Smartlock|Thang máy thẻ từ|Máy giặt & sấy").status("ACTIVE").isHot(false).views7d(420L).build(),
            PropertyEntity.builder().owner("host.demo").name("ODauDay Stay Sapa Eco").type("Nhà gỗ view thung lũng").address("Bản Tả Van, Thị xã Sa Pa, Lào Cai").city("Lào Cai").area("Sa Pa").rating(null).reviewsCount(0).priceMin(1250000.0).desc("Bungalow gỗ pơmu tự nhiên nhìn thẳng ra thung lũng Mường Hoa, săn mây buổi sớm và thưởng thức cà phê ngắm ruộng bậc thang.").image("https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80").badge("Mới ra mắt").amenitiesRaw("View săn mây|Bữa sáng miễn phí|Lò sưởi củi|Hỗ trợ thuê xe máy").status("ACTIVE").isHot(false).views7d(310L).build(),
            PropertyEntity.builder().owner("host.demo").name("ODauDay Stay Đà Lạt Mộng Mơ").type("Nhà gỗ đồi thông").address("Đường Khởi Nghĩa Bắc Sơn, Phường 10, TP. Đà Lạt").city("Lâm Đồng").area("Đà Lạt").rating(null).reviewsCount(0).priceMin(580000.0).desc("Nhà gỗ nép mình giữa rừng thông cổ thụ, view săn mây và thung lũng đèn lãng mạn buổi tối.").image("https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80").badge("Săn mây").amenitiesRaw("Sân nướng BBQ|Lò sưởi củi|View đồi thông|Bữa sáng bản địa").status("ACTIVE").isHot(false).views7d(650L).build(),
            PropertyEntity.builder().owner("host.demo").name("ODauDay Stay Phố Cổ Heritage").type("Căn hộ Indochine").address("Số 18 Hàng Vôi, Phường Lý Thái Tổ, Hoàn Kiếm, Hà Nội").city("Hà Nội").area("Phố Cổ").rating(null).reviewsCount(0).priceMin(850000.0).desc("Không gian kiến trúc Pháp cổ giao tọa nét văn hóa Tràng An, đi bộ 3 phút tới Hồ Hoàn Kiếm.").image("https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80").badge("Trung tâm phố cổ").amenitiesRaw("Đi bộ ra Hồ Gươm|Ban công cổ kính|Smartlock|Máy giặt & sấy").status("ACTIVE").isHot(false).views7d(280L).build(),
            PropertyEntity.builder().owner("host.demo").name("ODauDay Stay Tam Đảo Mây Ngàn").type("Biệt thự sinh thái").address("Khu 1, Thị trấn Tam Đảo, Vĩnh Phúc").city("Vĩnh Phúc").area("Tam Đảo").rating(null).reviewsCount(0).priceMin(1100000.0).desc("Villa đồi cao nhìn trọn cảnh biển mây Tam Đảo, trang bị bể bơi vô cực nước ấm và sân thượng BBQ.").image("https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80").badge("Bể bơi vô cực").amenitiesRaw("Bể bơi nước ấm|Sân BBQ hoàng hôn|Khu vui chơi trẻ em|Karaoke gia đình").status("ACTIVE").isHot(true).views7d(1250L).build(),
            PropertyEntity.builder().owner("host.demo").name("ODauDay Stay Ninh Bình Mountain").type("Bungalow ven hồ").address("Thôn Tràng An, Xã Trường Yên, Hoa Lư, Ninh Bình").city("Ninh Bình").area("Tràng An").rating(null).reviewsCount(0).priceMin(680000.0).desc("Bungalow mái cọ giữa hồ sen ngắm núi đá vôi sừng sững, trải nghiệm chèo thuyền kayak miễn phí.").image("https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=1200&q=80").badge("Gần di sản Tràng An").amenitiesRaw("Thuyền Kayak miễn phí|Xe đạp dạo hồ|Bữa sáng phục vụ tận phòng|Câu cá giải trí").status("ACTIVE").isHot(false).views7d(210L).build(),
            PropertyEntity.builder().owner("host.demo").name("ODauDay Stay Hội An Riverside").type("Nhà vườn truyền thống").address("Số 54 Nguyễn Tri Phương, Cẩm Nam, Hội An, Quảng Nam").city("Quảng Nam").area("Hội An").rating(null).reviewsCount(0).priceMin(750000.0).desc("Nhà cổ ngói âm dương bên bờ sông Hoài hiền hòa, cách phố cổ đèn lồng chỉ 500m tản bộ.").image("https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=1200&q=80").badge("Ven sông Hoài").amenitiesRaw("Hồ bơi sân vườn|Đạp xe phố cổ|Tiệc trà chiều|Bữa sáng đặc sản Hội An").status("ACTIVE").isHot(false).views7d(380L).build(),
            PropertyEntity.builder().owner("host.demo").name("ODauDay Stay Phú Quốc Sunset").type("Villa sát biển").address("Đường Trần Hưng Đạo, Dương Tơ, TP. Phú Quốc, Kiên Giang").city("Kiên Giang").area("Phú Quốc").rating(null).reviewsCount(0).priceMin(1450000.0).desc("Biệt thự bờ biển ngắm trọn hoàng hôn Bãi Trường, bước vài bước chân chạm ngay cát trắng và sóng biển.").image("https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80").badge("Sát biển Bãi Trường").amenitiesRaw("Bãi biển riêng|Hồ bơi hướng biển|Quầy bar ngoài trời|Đưa đón sân bay").status("ACTIVE").isHot(false).views7d(510L).build(),
            PropertyEntity.builder().owner("host.demo").name("ODauDay Stay Hạ Long Bay View").type("Căn hộ dịch vụ").address("Tòa Green Bay Premium, Hoàng Quốc Việt, Bãi Cháy, Quảng Ninh").city("Quảng Ninh").area("Hạ Long").rating(null).reviewsCount(0).priceMin(950000.0).desc("Căn hộ cao cấp tầng 22 phóng tầm mắt bao trọn vịnh Hạ Long kỳ vĩ, đi bộ ra bãi tắm Bãi Cháy.").image("https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80").badge("View vịnh Hạ Long").amenitiesRaw("View vịnh 180 độ|Bể bơi bốn mùa|Bếp hiện đại|Cạnh chợ đêm hải sản").status("ACTIVE").isHot(false).views7d(490L).build(),
            PropertyEntity.builder().owner("host.demo").name("ODauDay Stay Vũng Tàu Ocean").type("Căn hộ view biển").address("Số 02 Lê Lợi, Phường 1, TP. Vũng Tàu, Bà Rịa - Vũng Tàu").city("Bà Rịa - Vũng Tàu").area("Vũng Tàu").rating(null).reviewsCount(0).priceMin(820000.0).desc("Căn hộ ban công lộng gió Bãi Trước, nội thất hiện đại tông màu xanh biển sảng khoái và yên tĩnh.").image("https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80").badge("Gần Bãi Trước").amenitiesRaw("Đi bộ 2 phút ra biển|Bếp nướng hải sản|Chỗ đỗ xe ô tô|Smart TV 65 inch").status("ACTIVE").isHot(false).views7d(320L).build(),
            PropertyEntity.builder().owner("host.demo").name("ODauDay Stay Huế Cố Đô").type("Homestay nhà vườn").address("Số 11 thôn Lại Thế, Xã Phú Thượng, Huyện Phú Vang, Thừa Thiên Huế").city("Thừa Thiên Huế").area("Huế").rating(null).reviewsCount(0).priceMin(520000.0).desc("Nhà rường truyền thống xứ Huế giữa vườn thanh trà râm mát, đắm chìm trong vẻ đẹp thơ mộng sông Hương.").image("https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80").badge("Văn hóa Cố Đô").amenitiesRaw("Thưởng trà cung đình|Vườn hoa trái xanh mát|Bếp nấu truyền thống|Thuê áo dài chụp ảnh").status("ACTIVE").isHot(false).views7d(190L).build(),
            PropertyEntity.builder().owner("host.demo").name("ODauDay Stay Quy Nhơn Sea").type("Bungalow biển").address("Bãi Xép, Phường Ghềnh Ráng, TP. Quy Nhơn, Bình Định").city("Bình Định").area("Quy Nhơn").rating(null).reviewsCount(0).priceMin(890000.0).desc("Bungalow vách đá nhìn xuống làng chài bình yên Bãi Xép, ngắm bình minh đại dương rực rỡ từ giường ngủ.").image("https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80").badge("View làng chài Bãi Xép").amenitiesRaw("Ngắm bình minh biển|Hải sản tươi sống làng chài|Lặn ngắm san hô|Võng thư giãn").status("ACTIVE").isHot(false).views7d(260L).build(),
            PropertyEntity.builder().owner("host.demo").name("ODauDay Stay Đà Nẵng Beachfront").type("Villa biển cao cấp").address("Võ Nguyên Giáp, Phường Mỹ An, Ngũ Hành Sơn, Đà Nẵng").city("Đà Nẵng").area("Biển Mỹ Khê").rating(4.9).reviewsCount(15).priceMin(1850000.0).desc("Villa sang trọng chỉ cách bãi biển Mỹ Khê vài bước chân, có hồ bơi riêng và sân thượng ngắm trọn bình minh biển Đông.").image("https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1200&q=80").badge("Sát biển Mỹ Khê").amenitiesRaw("Hồ bơi vô cực|View biển 360|Bữa sáng phục vụ tận phòng|BBQ hải sản ngoài trời|Xe đưa đón sân bay").status("ACTIVE").isHot(true).views7d(1650L).build(),
            PropertyEntity.builder().owner("host.demo").name("ODauDay Stay Sài Gòn Skyview").type("Căn hộ cao cấp").address("Tòa Landmark Plus, Vinhomes Central Park, Bình Thạnh, TP. Hồ Chí Minh").city("TP. Hồ Chí Minh").area("Quận 1 / Bình Thạnh").rating(4.8).reviewsCount(22).priceMin(1200000.0).desc("Căn hộ tầng cao tầm nhìn panorama sông Sài Gòn và tòa Landmark 81, nội thất hiện đại sang trọng, đi bộ sang công viên bờ sông.").image("https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80").badge("View sông Sài Gòn").amenitiesRaw("View Landmark 81|Hồ bơi tràn viền|Phòng Gym cao cấp|Smartlock tự nhận phòng|Bếp hiện đại").status("ACTIVE").isHot(true).views7d(2100L).build(),
            PropertyEntity.builder().owner("host.demo").name("ODauDay Stay Nha Trang Bay").type("Penthouse view vịnh").address("Số 04 Trần Phú, Phường Xương Huân, TP. Nha Trang, Khánh Hòa").city("Khánh Hòa").area("Nha Trang").rating(4.7).reviewsCount(18).priceMin(1350000.0).desc("Penthouse tầng 30 ngắm nhìn toàn cảnh vịnh Nha Trang xanh ngắt và cáp treo Vinpearl, đầy đủ tiện nghi nghỉ dưỡng cho gia đình.").image("https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80").badge("View vịnh Nha Trang").amenitiesRaw("Ban công ngắm biển|Bể bơi tầng thượng|Bếp nấu hải sản|Smart TV 65 inch|Chỗ đỗ xe miễn phí").status("ACTIVE").isHot(true).views7d(1120L).build()
        );

        propertyRepository.saveAll(props);
        log.info("Seeded {} properties into Oracle DB.", props.size());
    }

    private void seedRooms() {
        if (roomRepository.count() >= 20) return;

        List<RoomEntity> rooms = List.of(
            // Prop 1: ODauDay Stay Hồ Tây
            RoomEntity.builder().propertyId(1L).propertyName("ODauDay Stay Hồ Tây").name("Phòng Garden").capacity(2).price(650000.0).weekendPrice(750000.0).desc("1 giường đôi Queen · View vườn xanh mát · Bếp nấu mini · Điều hòa 2 chiều").status("ACTIVE").build(),
            RoomEntity.builder().propertyId(1L).propertyName("ODauDay Stay Hồ Tây").name("Phòng Family").capacity(4).price(1100000.0).weekendPrice(1300000.0).desc("2 giường King · Ban công lớn nhìn ra hồ · Phòng tắm kính tiện nghi").status("ACTIVE").build(),
            RoomEntity.builder().propertyId(1L).propertyName("ODauDay Stay Hồ Tây").name("Phòng Panorama Hồ Tây").capacity(2).price(850000.0).weekendPrice(950000.0).desc("1 giường đôi King · Cửa kính lớn view hồ Tây · Bếp nhỏ tiện nghi").status("ACTIVE").build(),

            // Prop 2: ODauDay Stay Ba Vì
            RoomEntity.builder().propertyId(2L).propertyName("ODauDay Stay Ba Vì").name("Villa Rừng Thông").capacity(8).price(2500000.0).weekendPrice(3200000.0).desc("3 phòng ngủ riêng biệt · Bếp nướng BBQ · Hồ bơi riêng ngoài trời").status("ACTIVE").build(),
            RoomEntity.builder().propertyId(2L).propertyName("ODauDay Stay Ba Vì").name("Bungalow Đồi Thông").capacity(2).price(720000.0).weekendPrice(850000.0).desc("1 giường King · View đồi thông thoáng đãng · Sân hiên BBQ ngoài trời").status("ACTIVE").build(),

            // Prop 3: ODauDay Stay Cầu Giấy
            RoomEntity.builder().propertyId(3L).propertyName("ODauDay Stay Cầu Giấy").name("Studio Deluxe").capacity(2).price(900000.0).weekendPrice(950000.0).desc("1 giường Queen · View thành phố tầng cao · Bàn làm việc cao cấp").status("ACTIVE").build(),
            RoomEntity.builder().propertyId(3L).propertyName("ODauDay Stay Cầu Giấy").name("Executive Suite").capacity(4).price(1350000.0).weekendPrice(1500000.0).desc("2 giường Queen · Tầng cao view panorama · Máy giặt sấy riêng").status("ACTIVE").build(),

            // Prop 4: ODauDay Stay Sapa Eco
            RoomEntity.builder().propertyId(4L).propertyName("ODauDay Stay Sapa Eco").name("Bungalow Thung Lũng").capacity(2).price(1250000.0).weekendPrice(1450000.0).desc("1 giường King gỗ pơmu · Ban công ngắm thung lũng Mường Hoa · Lò sưởi củi").status("ACTIVE").build(),
            RoomEntity.builder().propertyId(4L).propertyName("ODauDay Stay Sapa Eco").name("Phòng Family Mây Ngàn").capacity(4).price(1850000.0).weekendPrice(2150000.0).desc("2 giường King · Tầng áp mái view săn mây 360 độ · Bồn tắm sục thảo dược").status("ACTIVE").build(),

            // Prop 5: ODauDay Stay Đà Lạt Mộng Mơ
            RoomEntity.builder().propertyId(5L).propertyName("ODauDay Stay Đà Lạt Mộng Mơ").name("Nhà Gỗ Đồi Thông").capacity(2).price(580000.0).weekendPrice(680000.0).desc("1 giường đôi Queen · View rừng thông lãng mạn · Sân nướng BBQ riêng").status("ACTIVE").build(),
            RoomEntity.builder().propertyId(5L).propertyName("ODauDay Stay Đà Lạt Mộng Mơ").name("Phòng Gác Mái Hoàng Hôn").capacity(4).price(890000.0).weekendPrice(1050000.0).desc("2 giường đôi · Cửa kính áp mái ngắm thung lũng đèn đêm · Bếp sưởi").status("ACTIVE").build(),

            // Prop 6: ODauDay Stay Phố Cổ Heritage
            RoomEntity.builder().propertyId(6L).propertyName("ODauDay Stay Phố Cổ Heritage").name("Căn Hộ Indochine Ban Công").capacity(2).price(850000.0).weekendPrice(980000.0).desc("1 giường King · Ban công cổ kính nhìn xuống phố cổ · Máy pha cà phê Espresso").status("ACTIVE").build(),
            RoomEntity.builder().propertyId(6L).propertyName("ODauDay Stay Phố Cổ Heritage").name("Suite Phố Cổ 2 Phòng Ngủ").capacity(4).price(1450000.0).weekendPrice(1650000.0).desc("2 phòng ngủ khép kín · Bếp đầy đủ tiện nghi · Cách Hồ Gươm 3 phút đi bộ").status("ACTIVE").build(),

            // Prop 7: ODauDay Stay Tam Đảo Mây Ngàn
            RoomEntity.builder().propertyId(7L).propertyName("ODauDay Stay Tam Đảo Mây Ngàn").name("Villa Đồi Mây").capacity(6).price(1950000.0).weekendPrice(2450000.0).desc("3 phòng ngủ · Sân thượng BBQ ngắm biển mây · Bể bơi vô cực nước ấm").status("ACTIVE").build(),
            RoomEntity.builder().propertyId(7L).propertyName("ODauDay Stay Tam Đảo Mây Ngàn").name("Phòng Deluxe Hướng Bể Bơi").capacity(2).price(1100000.0).weekendPrice(1300000.0).desc("1 giường King · Cửa kính lùa bước thẳng ra bể bơi · Bồn tắm view núi").status("ACTIVE").build(),

            // Prop 8: ODauDay Stay Ninh Bình Mountain
            RoomEntity.builder().propertyId(8L).propertyName("ODauDay Stay Ninh Bình Mountain").name("Bungalow Ven Hồ Sen").capacity(2).price(680000.0).weekendPrice(790000.0).desc("1 giường đôi King mái lá tự nhiên · View hồ sen và núi đá Tràng An · Kayak miễn phí").status("ACTIVE").build(),
            RoomEntity.builder().propertyId(8L).propertyName("ODauDay Stay Ninh Bình Mountain").name("Phòng Family Tràng An").capacity(4).price(1150000.0).weekendPrice(1350000.0).desc("2 giường Queen · Ban công câu cá riêng · Bữa sáng đặc sản Ninh Bình").status("ACTIVE").build(),

            // Prop 9: ODauDay Stay Hội An Riverside
            RoomEntity.builder().propertyId(9L).propertyName("ODauDay Stay Hội An Riverside").name("Phòng Vườn Sông Hoài").capacity(2).price(750000.0).weekendPrice(880000.0).desc("1 giường King · View vườn nhiệt đới ven sông · Xe đạp dạo phố cổ miễn phí").status("ACTIVE").build(),
            RoomEntity.builder().propertyId(9L).propertyName("ODauDay Stay Hội An Riverside").name("Villa Cổ Hoàng Gia").capacity(4).price(1550000.0).weekendPrice(1750000.0).desc("2 giường King · Hồ bơi riêng trong sân vườn cổ · Trà chiều đặc sản Hội An").status("ACTIVE").build(),

            // Prop 10: ODauDay Stay Phú Quốc Sunset
            RoomEntity.builder().propertyId(10L).propertyName("ODauDay Stay Phú Quốc Sunset").name("Bungalow Bãi Trường").capacity(2).price(1450000.0).weekendPrice(1650000.0).desc("1 giường King sát bờ cát · Ngắm trọn hoàng hôn biển đảo · Đưa đón sân bay").status("ACTIVE").build(),
            RoomEntity.builder().propertyId(10L).propertyName("ODauDay Stay Phú Quốc Sunset").name("Beachfront Sunset Villa").capacity(4).price(2450000.0).weekendPrice(2850000.0).desc("2 phòng ngủ · Hồ bơi vô cực hướng biển · Quầy bar cocktail riêng").status("ACTIVE").build(),

            // Prop 11: ODauDay Stay Hạ Long Bay View
            RoomEntity.builder().propertyId(11L).propertyName("ODauDay Stay Hạ Long Bay View").name("Căn Hộ Premium View Vịnh").capacity(3).price(950000.0).weekendPrice(1100000.0).desc("1 giường King + 1 sofa bed · Tầng 22 view trọn vẹn vịnh kỳ quan · Bể bơi bốn mùa").status("ACTIVE").build(),
            RoomEntity.builder().propertyId(11L).propertyName("ODauDay Stay Hạ Long Bay View").name("Sky Suite Panorama").capacity(4).price(1550000.0).weekendPrice(1800000.0).desc("2 phòng ngủ view vịnh 180 độ · Ban công ngắm bình minh · Bếp hiện đại").status("ACTIVE").build(),

            // Prop 12: ODauDay Stay Vũng Tàu Ocean
            RoomEntity.builder().propertyId(12L).propertyName("ODauDay Stay Vũng Tàu Ocean").name("Studio View Biển").capacity(2).price(820000.0).weekendPrice(950000.0).desc("1 giường đôi King · Ban công view biển Bãi Trước · Bếp hiện đại · Điều hòa 2 chiều").status("ACTIVE").build(),
            RoomEntity.builder().propertyId(12L).propertyName("ODauDay Stay Vũng Tàu Ocean").name("Căn Hộ Family Bãi Trước").capacity(4).price(1350000.0).weekendPrice(1550000.0).desc("2 phòng ngủ ban công biển · Bếp nấu hải sản tươi sống · Đi bộ 2 phút ra bãi tắm").status("ACTIVE").build(),

            // Prop 13: ODauDay Stay Huế Cố Đô
            RoomEntity.builder().propertyId(13L).propertyName("ODauDay Stay Huế Cố Đô").name("Nhà Rường Vườn Thanh Trà").capacity(2).price(520000.0).weekendPrice(600000.0).desc("1 giường King nhà rường truyền thống · Thưởng trà cung đình · Vườn hoa quả râm mát").status("ACTIVE").build(),
            RoomEntity.builder().propertyId(13L).propertyName("ODauDay Stay Huế Cố Đô").name("Phòng Gia Đình Cố Đô").capacity(4).price(850000.0).weekendPrice(980000.0).desc("2 giường Queen · View vườn xanh mát · Bếp gia đình riêng biệt").status("ACTIVE").build(),

            // Prop 14: ODauDay Stay Quy Nhơn Sea
            RoomEntity.builder().propertyId(14L).propertyName("ODauDay Stay Quy Nhơn Sea").name("Bungalow Vách Đá Bãi Xép").capacity(2).price(890000.0).weekendPrice(990000.0).desc("1 giường King · View đại dương và làng chài Bãi Xép · Thưởng thức hải sản tươi").status("ACTIVE").build(),
            RoomEntity.builder().propertyId(14L).propertyName("ODauDay Stay Quy Nhơn Sea").name("Ocean Villa Bãi Xép").capacity(4).price(1600000.0).weekendPrice(1850000.0).desc("2 giường King sát biển · Sân hiên ngắm bình minh đại dương · Bếp BBQ").status("ACTIVE").build(),

            // Prop 15: ODauDay Stay Đà Nẵng Beachfront
            RoomEntity.builder().propertyId(15L).propertyName("ODauDay Stay Đà Nẵng Beachfront").name("Villa Ocean Deluxe").capacity(4).price(1850000.0).weekendPrice(2100000.0).desc("2 giường King · Hồ bơi riêng · Ban công view biển Mỹ Khê · Bếp hiện đại").status("ACTIVE").build(),
            RoomEntity.builder().propertyId(15L).propertyName("ODauDay Stay Đà Nẵng Beachfront").name("Phòng Premier Mỹ Khê").capacity(2).price(1250000.0).weekendPrice(1400000.0).desc("1 giường King · Cửa kính panorama ngắm biển Mỹ Khê · Bồn tắm hướng biển").status("ACTIVE").build(),

            // Prop 16: ODauDay Stay Sài Gòn Skyview
            RoomEntity.builder().propertyId(16L).propertyName("ODauDay Stay Sài Gòn Skyview").name("Sky Suite 2BR").capacity(4).price(1200000.0).weekendPrice(1350000.0).desc("2 phòng ngủ · View Landmark 81 & sông Sài Gòn · Máy giặt sấy · Smartlock").status("ACTIVE").build(),
            RoomEntity.builder().propertyId(16L).propertyName("ODauDay Stay Sài Gòn Skyview").name("Studio Landmark Panorama").capacity(2).price(850000.0).weekendPrice(950000.0).desc("1 giường Queen · Tầng cao ngắm hoàng hôn sông Sài Gòn · Thang máy thẻ từ").status("ACTIVE").build(),

            // Prop 17: ODauDay Stay Nha Trang Bay
            RoomEntity.builder().propertyId(17L).propertyName("ODauDay Stay Nha Trang Bay").name("Penthouse Bay View").capacity(4).price(1350000.0).weekendPrice(1550000.0).desc("2 giường King · Ban công ngắm vịnh Nha Trang · Bếp nấu hải sản · Điều hòa 2 chiều").status("ACTIVE").build(),
            RoomEntity.builder().propertyId(17L).propertyName("ODauDay Stay Nha Trang Bay").name("Deluxe Hướng Biển Trần Phú").capacity(2).price(950000.0).weekendPrice(1100000.0).desc("1 giường King · Đi bộ 1 phút qua đường là bãi biển · Ban công lộng gió biển").status("ACTIVE").build()
        );

        for (RoomEntity r : rooms) {
            if (!roomRepository.existsByPropertyIdAndName(r.getPropertyId(), r.getName())) {
                roomRepository.save(r);
            }
        }
        log.info("Seeded total {} rooms into DB.", roomRepository.count());
    }

    private void seedRoomBlocks() {
    }

    private void seedBookings() {
        if (bookingRepository.count() > 0) return;

        List<BookingEntity> bookings = List.of(
            BookingEntity.builder().code("ODD-DEMO-0001").guestUsername("guest.demo").guestName("Khách thuê Demo (Lê Hoàng Nam)").guestPhone("0900000003").guestEmail("nam.le@gmail.com").propertyId(1L).propertyName("ODauDay Stay Hồ Tây").roomId(1L).roomName("Phòng Garden").checkIn(day(-20)).checkOut(day(-18)).nights(2).guests(2).pricePerNight(650000.0).subtotal(1300000.0).serviceFee(0.0).total(1300000.0).status("COMPLETED").paymentMethod("BANK_TRANSFER").createdAt(day(-25)).isReviewed(true).build(),
            BookingEntity.builder().code("ODD-DEMO-0002").guestUsername("guest.demo").guestName("Khách thuê Demo (Lê Hoàng Nam)").guestPhone("0900000003").guestEmail("nam.le@gmail.com").propertyId(1L).propertyName("ODauDay Stay Hồ Tây").roomId(1L).roomName("Phòng Garden").checkIn(day(14)).checkOut(day(16)).nights(2).guests(2).pricePerNight(650000.0).subtotal(1300000.0).serviceFee(0.0).total(1300000.0).status("PENDING").paymentMethod("CASH").createdAt(day(-3)).isReviewed(false).build(),
            BookingEntity.builder().code("ODD-DEMO-0003").guestUsername("guest.demo").guestName("Khách thuê Demo (Lê Hoàng Nam)").guestPhone("0900000003").guestEmail("nam.le@gmail.com").propertyId(1L).propertyName("ODauDay Stay Hồ Tây").roomId(1L).roomName("Phòng Garden").checkIn(day(-1)).checkOut(day(2)).nights(3).guests(2).pricePerNight(650000.0).subtotal(1950000.0).serviceFee(0.0).total(1950000.0).status("CHECKED_IN").paymentMethod("BANK_TRANSFER").createdAt(day(-10)).isReviewed(false).build(),
            BookingEntity.builder().code("ODD-DEMO-0004").guestUsername("linh.tran").guestName("Trần Thùy Linh").guestPhone("0912345678").guestEmail("linh.tran@gmail.com").propertyId(1L).propertyName("ODauDay Stay Hồ Tây").roomId(2L).roomName("Phòng Family").checkIn(day(7)).checkOut(day(9)).nights(2).guests(4).pricePerNight(1100000.0).subtotal(2200000.0).serviceFee(0.0).total(2200000.0).status("CONFIRMED").paymentMethod("BANK_TRANSFER").createdAt(day(-2)).isReviewed(false).build(),
            BookingEntity.builder().code("ODD-DEMO-0005").guestUsername("hoang.anh").guestName("Nguyễn Hoàng Anh").guestPhone("0987654321").guestEmail("hoang.anh@gmail.com").propertyId(1L).propertyName("ODauDay Stay Hồ Tây").roomId(1L).roomName("Phòng Garden").checkIn(day(30)).checkOut(day(32)).nights(2).guests(2).pricePerNight(650000.0).subtotal(1300000.0).serviceFee(0.0).total(1300000.0).status("CONFIRMED").paymentMethod("CASH").createdAt(day(0)).isReviewed(false).build()
        );

        bookingRepository.saveAll(bookings);
        log.info("Seeded {} bookings into Oracle DB.", bookings.size());
    }

    private void seedReviews() {
        if (reviewRepository.count() > 0) return;

        List<ReviewEntity> reviews = List.of(
            ReviewEntity.builder().bookingCode("ODD-DEMO-0001").propertyId(1L).guestUsername("guest.demo").guestName("Khách thuê Demo").rating(5).comment("Phòng sạch sẽ, không gian thoáng đãng mát mẻ, chủ nhà hỗ trợ check-in rất nhanh chóng và nhiệt tình. Vị trí đi bộ ra hồ Tây rất gần!").date(viDay(-17)).build()
        );

        reviewRepository.saveAll(reviews);
        log.info("Seeded {} reviews into Oracle DB.", reviews.size());
    }

    private void seedPromotions() {
        if (promotionRepository.count() > 0) return;

        List<PromotionEntity> promos = List.of(
            PromotionEntity.builder().code("ODAUDAY10").type("PERCENT").value(10.0).maxDiscount(200000.0).minOrder(500000.0).usageLimit(100).usedCount(18).validFrom(day(-300)).validTo(day(365)).status("ACTIVE").build(),
            PromotionEntity.builder().code("CHAOHE2027").type("FIXED").value(150000.0).minOrder(1000000.0).usageLimit(50).usedCount(12).validFrom("2027-05-01").validTo("2027-08-31").status("ACTIVE").build(),
            PromotionEntity.builder().code("VIPTRAVEL").type("PERCENT").value(20.0).maxDiscount(500000.0).minOrder(2000000.0).usageLimit(30).usedCount(30).validFrom("2027-01-01").validTo("2027-06-30").status("INACTIVE").build(),
            PromotionEntity.builder().code("WELCOME50K").type("FIXED").value(50000.0).minOrder(300000.0).usageLimit(200).usedCount(45).validFrom(day(-300)).validTo(day(365)).status("ACTIVE").build()
        );

        promotionRepository.saveAll(promos);
        log.info("Seeded {} promotions into Oracle DB.", promos.size());
    }

    private void seedAuditLogs() {
        if (auditLogRepository.count() > 0) return;

        List<AuditLogEntity> logs = List.of(
            AuditLogEntity.builder().action("LOCK").target("minh.pham").details("Khóa tài khoản do vi phạm chính sách tiếp đón khách").performedBy("admin").timestamp(day(-2) + " 14:30:22").build(),
            AuditLogEntity.builder().action("CHANGE_ROLE").target("host.demo").details("Phê duyệt nâng cấp vai trò từ GUEST sang HOST").performedBy("admin").timestamp(day(-6) + " 09:15:00").build(),
            AuditLogEntity.builder().action("CREATE_PROMO").target("CHAOHE2027").details("Phát hành chiến dịch voucher mùa hè toàn sàn").performedBy("admin").timestamp(day(-10) + " 11:20:45").build(),
            AuditLogEntity.builder().action("TOGGLE_PROPERTY").target("ODauDay Stay Hồ Tây").details("Kiểm duyệt chất lượng và xác thực cơ sở lưu trú đạt chuẩn").performedBy("admin").timestamp(day(-14) + " 16:45:10").build()
        );

        auditLogRepository.saveAll(logs);
        log.info("Seeded {} audit logs into Oracle DB.", logs.size());
    }
}
