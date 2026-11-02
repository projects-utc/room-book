// ODauDay Stay — Initial data with TypeScript models

export interface User {
  id: number;
  role: 'ADMIN' | 'HOST' | 'GUEST';
  username: string;
  password?: string;
  fullName: string;
  phone: string;
  status: 'ACTIVE' | 'LOCKED';
  email: string;
}

export interface Property {
  id: number;
  owner: string;
  name: string;
  type: string;
  address: string;
  city: string;
  area: string;
  rating: number;
  reviewsCount: number;
  priceMin: number;
  desc: string;
  image: string;
  badge?: string;
  amenities: string[];
}

export interface Room {
  id: number;
  propertyId: number;
  propertyName: string;
  name: string;
  capacity: number;
  price: number;
  weekendPrice?: number;
  desc: string;
  status: 'ACTIVE' | 'MAINTENANCE';
}

export interface RoomBlock {
  id: number;
  roomId: number;
  roomName: string;
  start: string;
  end: string;
  reason: string;
}

export interface Booking {
  code: string;
  guestUsername: string;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  propertyId: number;
  propertyName: string;
  roomId: number;
  roomName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  pricePerNight: number;
  subtotal: number;
  serviceFee: number;
  total: number;
  status: 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';
  createdAt: string;
  isReviewed: boolean;
}

export interface Review {
  id: number;
  bookingCode: string;
  propertyId: number;
  guestUsername: string;
  guestName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface InitialDataState {
  users: User[];
  properties: Property[];
  rooms: Room[];
  roomBlocks: RoomBlock[];
  bookings: Booking[];
  reviews: Review[];
}

export const INITIAL_DATA: InitialDataState = {
  users: [
    { id: 1, role: 'ADMIN', username: 'admin', password: '123', fullName: 'Quản trị viên Hệ thống', phone: '0900000001', status: 'ACTIVE', email: 'admin@odauday.vn' },
    { id: 2, role: 'HOST', username: 'host.demo', password: '123', fullName: 'Chủ nhà Demo (Nguyễn Văn An)', phone: '0900000002', status: 'ACTIVE', email: 'host.an@gmail.com' },
    { id: 3, role: 'GUEST', username: 'guest.demo', password: '123', fullName: 'Khách thuê Demo (Lê Hoàng Nam)', phone: '0900000003', status: 'ACTIVE', email: 'nam.le@gmail.com' },
    { id: 4, role: 'GUEST', username: 'linh.tran', password: '123', fullName: 'Trần Thùy Linh', phone: '0912345678', status: 'ACTIVE', email: 'linh.tran@gmail.com' },
    { id: 5, role: 'HOST', username: 'minh.pham', password: '123', fullName: 'Phạm Quang Minh (Tài khoản bị khóa)', phone: '0900000005', status: 'LOCKED', email: 'minh.pham@gmail.com' },
  ],
  properties: [
    { id: 1, owner: 'host.demo', name: 'ODauDay Stay Hồ Tây', type: 'Homestay', address: 'Số 12 ngõ 29 Quảng Bá, Quận Tây Hồ, Hà Nội', city: 'Hà Nội', area: 'Hồ Tây', rating: 5.0, reviewsCount: 24, priceMin: 650000, desc: 'Không gian yên tĩnh ven hồ Tây, view hồ thoáng mát, đầy đủ tiện nghi nghỉ dưỡng và bếp nấu riêng biệt.', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80', badge: 'Yêu thích nhất', amenities: ['Wifi 500M', 'Sân vườn', 'Bếp nấu riêng', 'Smart TV 55 inch', 'Tự nhận phòng bằng khóa số'] },
    { id: 2, owner: 'host.demo', name: 'ODauDay Stay Ba Vì', type: 'Biệt thự sinh thái', address: 'Thôn Mái, Yên Bài, Ba Vì, Hà Nội', city: 'Hà Nội', area: 'Ba Vì', rating: 4.6, reviewsCount: 18, priceMin: 720000, desc: 'Biệt thự đồi thông trong lành, có bể bơi ngoài trời và sân cỏ BBQ sức chứa lớn cho gia đình.', image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80', badge: 'View núi đồi', amenities: ['Bể bơi', 'Sân BBQ', 'Sân cỏ teambuilding', 'Chỗ đỗ xe ô tô miễn phí'] },
    { id: 3, owner: 'host.demo', name: 'ODauDay Stay Cầu Giấy', type: 'Căn hộ dịch vụ', address: 'Tòa Central Point, 219 Trung Kính, Cầu Giấy, Hà Nội', city: 'Hà Nội', area: 'Cầu Giấy', rating: 4.4, reviewsCount: 32, priceMin: 900000, desc: 'Căn hộ Studio cao cấp ngay trung tâm thương mại, di chuyển thuận tiện tới các trường đại học và phố ẩm thực.', image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80', badge: 'Trung tâm', amenities: ['Smart TV', 'Smartlock', 'Thang máy thẻ từ', 'Máy giặt & sấy'] },
    { id: 4, owner: 'host.demo', name: 'ODauDay Stay Sapa Eco', type: 'Nhà gỗ view thung lũng', address: 'Bản Tả Van, Thị xã Sa Pa, Lào Cai', city: 'Lào Cai', area: 'Sa Pa', rating: 4.9, reviewsCount: 45, priceMin: 1250000, desc: 'Bungalow gỗ pơmu tự nhiên nhìn thẳng ra thung lũng Mường Hoa, săn mây buổi sớm và thưởng thức cà phê ngắm ruộng bậc thang.', image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80', badge: 'Mới ra mắt', amenities: ['View săn mây', 'Bữa sáng miễn phí', 'Lò sưởi củi', 'Hỗ trợ thuê xe máy'] },
    { id: 5, owner: 'host.demo', name: 'ODauDay Stay Đà Lạt Mộng Mơ', type: 'Nhà gỗ đồi thông', address: 'Đường Khởi Nghĩa Bắc Sơn, Phường 10, TP. Đà Lạt', city: 'Lâm Đồng', area: 'Đà Lạt', rating: 4.9, reviewsCount: 56, priceMin: 580000, desc: 'Nhà gỗ nép mình giữa rừng thông cổ thụ, view săn mây và thung lũng đèn lãng mạn buổi tối.', image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80', badge: 'Săn mây', amenities: ['Sân nướng BBQ', 'Lò sưởi củi', 'View đồi thông', 'Bữa sáng bản địa'] },
    { id: 6, owner: 'host.demo', name: 'ODauDay Stay Phố Cổ Heritage', type: 'Căn hộ Indochine', address: 'Số 18 Hàng Vôi, Phường Lý Thái Tổ, Hoàn Kiếm, Hà Nội', city: 'Hà Nội', area: 'Phố Cổ', rating: 4.8, reviewsCount: 38, priceMin: 850000, desc: 'Không gian kiến trúc Pháp cổ giao thoa nét văn hóa Tràng An, đi bộ 3 phút tới Hồ Hoàn Kiếm.', image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80', badge: 'Trung tâm phố cổ', amenities: ['Đi bộ ra Hồ Gươm', 'Ban công cổ kính', 'Smartlock', 'Máy giặt & sấy'] },
    { id: 7, owner: 'host.demo', name: 'ODauDay Stay Tam Đảo Mây Ngàn', type: 'Biệt thự sinh thái', address: 'Khu 1, Thị trấn Tam Đảo, Vĩnh Phúc', city: 'Vĩnh Phúc', area: 'Tam Đảo', rating: 4.7, reviewsCount: 29, priceMin: 1100000, desc: 'Villa đồi cao nhìn trọn cảnh biển mây Tam Đảo, trang bị bể bơi vô cực nước ấm và sân thượng BBQ.', image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80', badge: 'Bể bơi vô cực', amenities: ['Bể bơi nước ấm', 'Sân BBQ hoàng hôn', 'Khu vui chơi trẻ em', 'Karaoke gia đình'] },
    { id: 8, owner: 'host.demo', name: 'ODauDay Stay Ninh Bình Mountain', type: 'Bungalow ven hồ', address: 'Thôn Tràng An, Xã Trường Yên, Hoa Lư, Ninh Bình', city: 'Ninh Bình', area: 'Tràng An', rating: 5.0, reviewsCount: 42, priceMin: 680000, desc: 'Bungalow mái cọ giữa hồ sen ngắm núi đá vôi sừng sững, trải nghiệm chèo thuyền kayak miễn phí.', image: 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=1200&q=80', badge: 'Gần di sản Tràng An', amenities: ['Thuyền Kayak miễn phí', 'Xe đạp dạo hồ', 'Bữa sáng phục vụ tận phòng', 'Câu cá giải trí'] },
    { id: 9, owner: 'host.demo', name: 'ODauDay Stay Hội An Riverside', type: 'Nhà vườn truyền thống', address: 'Số 54 Nguyễn Tri Phương, Cẩm Nam, Hội An, Quảng Nam', city: 'Quảng Nam', area: 'Hội An', rating: 4.9, reviewsCount: 63, priceMin: 750000, desc: 'Nhà cổ ngói âm dương bên bờ sông Hoài hiền hòa, cách phố cổ đèn lồng chỉ 500m tản bộ.', image: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=1200&q=80', badge: 'Ven sông Hoài', amenities: ['Hồ bơi sân vườn', 'Đạp xe phố cổ', 'Tiệc trà chiều', 'Bữa sáng đặc sản Hội An'] },
    { id: 10, owner: 'host.demo', name: 'ODauDay Stay Phú Quốc Sunset', type: 'Villa sát biển', address: 'Đường Trần Hưng Đạo, Dương Tơ, TP. Phú Quốc, Kiên Giang', city: 'Kiên Giang', area: 'Phú Quốc', rating: 4.8, reviewsCount: 51, priceMin: 1450000, desc: 'Biệt thự bờ biển ngắm trọn hoàng hôn Bãi Trường, bước vài bước chân chạm ngay cát trắng và sóng biển.', image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80', badge: 'Sát biển Bãi Trường', amenities: ['Bãi biển riêng', 'Hồ bơi hướng biển', 'Quầy bar ngoài trời', 'Đưa đón sân bay'] },
    { id: 11, owner: 'host.demo', name: 'ODauDay Stay Hạ Long Bay View', type: 'Căn hộ dịch vụ', address: 'Tòa Green Bay Premium, Hoàng Quốc Việt, Bãi Cháy, Quảng Ninh', city: 'Quảng Ninh', area: 'Hạ Long', rating: 4.7, reviewsCount: 34, priceMin: 950000, desc: 'Căn hộ cao cấp tầng 22 phóng tầm mắt bao trọn vịnh Hạ Long kỳ vĩ, đi bộ ra bãi tắm Bãi Cháy.', image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80', badge: 'View vịnh Hạ Long', amenities: ['View vịnh 180 độ', 'Bể bơi bốn mùa', 'Bếp hiện đại', 'Cạnh chợ đêm hải sản'] },
    { id: 12, owner: 'host.demo', name: 'ODauDay Stay Vũng Tàu Ocean', type: 'Căn hộ view biển', address: 'Số 02 Lê Lợi, Phường 1, TP. Vũng Tàu, Bà Rịa - Vũng Tàu', city: 'Bà Rịa - Vũng Tàu', area: 'Vũng Tàu', rating: 4.6, reviewsCount: 27, priceMin: 820000, desc: 'Căn hộ ban công lộng gió Bãi Trước, nội thất hiện đại tông màu xanh biển sảng khoái và yên tĩnh.', image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80', badge: 'Gần Bãi Trước', amenities: ['Đi bộ 2 phút ra biển', 'Bếp nướng hải sản', 'Chỗ đỗ xe ô tô', 'Smart TV 65 inch'] },
    { id: 13, owner: 'host.demo', name: 'ODauDay Stay Huế Cố Đô', type: 'Homestay nhà vườn', address: 'Số 11 thôn Lại Thế, Xã Phú Thượng, Huyện Phú Vang, Thừa Thiên Huế', city: 'Thừa Thiên Huế', area: 'Huế', rating: 4.9, reviewsCount: 31, priceMin: 520000, desc: 'Nhà rường truyền thống xứ Huế giữa vườn thanh trà râm mát, đắm chìm trong vẻ đẹp thơ mộng sông Hương.', image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80', badge: 'Văn hóa Cố Đô', amenities: ['Thưởng trà cung đình', 'Vườn hoa trái xanh mát', 'Bếp nấu truyền thống', 'Thuê áo dài chụp ảnh'] },
    { id: 14, owner: 'host.demo', name: 'ODauDay Stay Quy Nhơn Sea', type: 'Bungalow biển', address: 'Bãi Xép, Phường Ghềnh Ráng, TP. Quy Nhơn, Bình Định', city: 'Bình Định', area: 'Quy Nhơn', rating: 4.8, reviewsCount: 22, priceMin: 890000, desc: 'Bungalow vách đá nhìn xuống làng chài bình yên Bãi Xép, ngắm bình minh đại dương rực rỡ từ giường ngủ.', image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80', badge: 'View làng chài Bãi Xép', amenities: ['Ngắm bình minh biển', 'Hải sản tươi sống làng chài', 'Lặn ngắm san hô', 'Võng thư giãn'] },
  ],
  rooms: [
    { id: 1, propertyId: 1, propertyName: 'ODauDay Stay Hồ Tây', name: 'Phòng Garden', capacity: 2, price: 650000, weekendPrice: 750000, desc: '1 giường đôi Queen · View vườn xanh mát · Bếp nấu mini · Điều hòa 2 chiều', status: 'ACTIVE' },
    { id: 2, propertyId: 1, propertyName: 'ODauDay Stay Hồ Tây', name: 'Phòng Family', capacity: 4, price: 1100000, weekendPrice: 1300000, desc: '2 giường King · Ban công lớn nhìn ra hồ · Phòng tắm kính tiện nghi', status: 'ACTIVE' },
    { id: 3, propertyId: 2, propertyName: 'ODauDay Stay Ba Vì', name: 'Villa Rừng Thông', capacity: 8, price: 2500000, weekendPrice: 3200000, desc: '3 phòng ngủ riêng biệt · Bếp nướng BBQ · Hồ bơi riêng ngoài trời', status: 'ACTIVE' },
    { id: 4, propertyId: 3, propertyName: 'ODauDay Stay Cầu Giấy', name: 'Studio Deluxe', capacity: 2, price: 900000, weekendPrice: 950000, desc: '1 giường Queen · View thành phố tầng cao · Bàn làm việc cao cấp', status: 'ACTIVE' },
  ],
  roomBlocks: [
    { id: 1, roomId: 2, roomName: 'Phòng Family', start: '2027-02-10', end: '2027-02-12', reason: 'Bảo trì hệ thống điều hòa và sơn mới ban công' },
  ],
  bookings: [
    { code: 'ODD-DEMO-0001', guestUsername: 'guest.demo', guestName: 'Khách thuê Demo (Lê Hoàng Nam)', guestPhone: '0900000003', guestEmail: 'nam.le@gmail.com', propertyId: 1, propertyName: 'ODauDay Stay Hồ Tây', roomId: 1, roomName: 'Phòng Garden', checkIn: '2027-01-10', checkOut: '2027-01-12', nights: 2, guests: 2, pricePerNight: 650000, subtotal: 1300000, serviceFee: 0, total: 1300000, status: 'COMPLETED', createdAt: '2026-12-20', isReviewed: true },
    { code: 'ODD-DEMO-0002', guestUsername: 'guest.demo', guestName: 'Khách thuê Demo (Lê Hoàng Nam)', guestPhone: '0900000003', guestEmail: 'nam.le@gmail.com', propertyId: 1, propertyName: 'ODauDay Stay Hồ Tây', roomId: 1, roomName: 'Phòng Garden', checkIn: '2027-02-20', checkOut: '2027-02-22', nights: 2, guests: 2, pricePerNight: 650000, subtotal: 1300000, serviceFee: 0, total: 1300000, status: 'PENDING', createdAt: '2027-01-02', isReviewed: false },
    { code: 'ODD-DEMO-0003', guestUsername: 'guest.demo', guestName: 'Khách thuê Demo (Lê Hoàng Nam)', guestPhone: '0900000003', guestEmail: 'nam.le@gmail.com', propertyId: 1, propertyName: 'ODauDay Stay Hồ Tây', roomId: 1, roomName: 'Phòng Garden', checkIn: '2027-03-01', checkOut: '2027-03-04', nights: 3, guests: 2, pricePerNight: 650000, subtotal: 1950000, serviceFee: 0, total: 1950000, status: 'CHECKED_IN', createdAt: '2027-01-01', isReviewed: false },
    { code: 'ODD-DEMO-0004', guestUsername: 'linh.tran', guestName: 'Trần Thùy Linh', guestPhone: '0912345678', guestEmail: 'linh.tran@gmail.com', propertyId: 1, propertyName: 'ODauDay Stay Hồ Tây', roomId: 2, roomName: 'Phòng Family', checkIn: '2027-01-20', checkOut: '2027-01-22', nights: 2, guests: 4, pricePerNight: 1100000, subtotal: 2200000, serviceFee: 0, total: 2200000, status: 'CONFIRMED', createdAt: '2027-01-15', isReviewed: false },
  ],
  reviews: [
    { id: 1, bookingCode: 'ODD-DEMO-0001', propertyId: 1, guestUsername: 'guest.demo', guestName: 'Khách thuê Demo', rating: 5, comment: 'Phòng sạch sẽ, không gian thoáng đãng mát mẻ, chủ nhà hỗ trợ check-in rất nhanh chóng và nhiệt tình. Vị trí đi bộ ra hồ Tây rất gần!', date: '13/01/2027' },
  ],
};
