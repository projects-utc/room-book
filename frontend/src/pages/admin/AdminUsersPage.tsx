// Admin Users Page: User Management & RBAC Role-Based Access Control (TypeScript)
import React, { useState } from 'react';
import { useStore } from '../../contexts/StoreContext';
import {
  Card,
  StatCard,
  Badge,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  Button,
  InputField,
  SelectField,
  Modal,
  EmptyState,
} from '../../components';
import {
  PeopleFill,
  PersonPlusFill,
  ShieldLock,
  LockFill,
  UnlockFill,
  ShieldCheck,
  Search,
  CheckCircleFill,
  ExclamationOctagonFill,
} from 'react-bootstrap-icons';
import { User } from '../../data';

export default function AdminUsersPage() {
  const { store, currentUser, addToast } = useStore();

  const [users, setUsers] = useState<User[]>(() => store.getAllUsers());
  const [kw, setKw] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showAddForm, setShowAddForm] = useState(false);

  // Add user form state
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('123');
  const [newFullName, setNewFullName] = useState('');
  const [newPhone, setNewPhone] = useState('0900000099');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'ADMIN' | 'HOST' | 'GUEST'>('HOST');

  const refreshList = () => {
    setUsers(store.getAllUsers());
  };

  const handleToggleStatus = (u: User) => {
    // Safety check: Cannot lock own admin account
    if (u.username === currentUser?.username || u.username === 'admin') {
      addToast('Quy tắc an toàn (ASSUM-01): Quản trị viên không thể tự khóa tài khoản chính mình!', 'error');
      return;
    }

    const res = store.toggleUserStatus(u.id);
    if (res.success) {
      addToast(`Đã chuyển trạng thái tài khoản ${u.username} sang ${res.newStatus}`, 'success');
      refreshList();
    }
  };

  const handleChangeRole = (u: User, newR: User['role']) => {
    if (u.username === 'admin' && newR !== 'ADMIN') {
      addToast('Quy tắc an toàn (ASSUM-01): Hệ thống phải duy trì ít nhất 01 Quản trị viên tối cao!', 'error');
      return;
    }

    store.changeUserRole(u.id, newR);
    addToast(`Đã đổi vai trò tài khoản ${u.username} thành ${newR}`, 'info');
    refreshList();
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    const res = store.addUser({
      username: newUsername,
      password: newPassword,
      fullName: newFullName,
      phone: newPhone,
      email: newEmail,
      role: newRole,
      status: 'ACTIVE',
    });

    if (res.success) {
      addToast(`Đã tạo tài khoản thành công cho ${newUsername}!`, 'success');
      setShowAddForm(false);
      refreshList();
      setNewUsername('');
      setNewFullName('');
      setNewEmail('');
    } else {
      addToast(res.message || 'Lỗi khi tạo tài khoản', 'error');
    }
  };

  const filteredUsers = users.filter((u) => {
    const kwLower = kw.toLowerCase().trim();
    const matchKw =
      !kwLower ||
      u.username.toLowerCase().includes(kwLower) ||
      u.fullName.toLowerCase().includes(kwLower) ||
      u.email.toLowerCase().includes(kwLower) ||
      u.phone.includes(kwLower);

    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchStatus = statusFilter === 'ALL' || u.status === statusFilter;

    return matchKw && matchRole && matchStatus;
  });

  const activeCount = users.filter((u) => u.status === 'ACTIVE').length;
  const lockedCount = users.filter((u) => u.status === 'LOCKED').length;
  const hostCount = users.filter((u) => u.role === 'HOST').length;
  const guestCount = users.filter((u) => u.role === 'GUEST').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, margin: '0 0 0.35rem', color: '#0F172A' }}>
            Quản lý Người dùng &amp; Phân quyền (UC-10 / RBAC)
          </h1>
          <p style={{ margin: 0, color: '#64748B', fontSize: '0.92rem' }}>
            Kiểm soát tài khoản toàn hệ thống, khóa/mở khóa tức thì và phân bổ quyền hạn vai trò (Role-Based Access Control).
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setShowAddForm(true)}
          style={{ background: 'linear-gradient(135deg, #FF385C 0%, #E00B41 100%)' }}
        >
          <PersonPlusFill /> Thêm người dùng mới
        </Button>
      </div>

      {/* 4 Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <StatCard
          label="Tổng số người dùng"
          value={`${users.length} tài khoản`}
          description="Được đăng ký trên hệ thống"
          variant="highlight"
        />
        <StatCard
          label="Tài khoản hoạt động"
          value={`${activeCount} người`}
          description="Đang hoạt động bình thường"
          trend="Độ tin cậy 100%"
          trendDirection="up"
        />
        <StatCard
          label="Chủ nhà đối tác (HOST)"
          value={`${hostCount} đối tác`}
          description="Sở hữu chỗ ở &amp; phòng cho thuê"
          trendDirection="up"
        />
        <StatCard
          label="Tài khoản bị khóa"
          value={`${lockedCount} tài khoản`}
          description="Đang bị chặn truy cập đăng nhập"
          trendDirection="neutral"
        />
      </div>

      {/* Main Table Card */}
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '1rem' }}>
            <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0F172A' }}>
              Danh sách tài khoản người dùng ({filteredUsers.length} kết quả)
            </span>
          </div>
        }
      >
        {/* Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.85rem', marginBottom: '1.25rem' }}>
          <InputField
            placeholder="Tìm theo tên đăng nhập, họ tên, email hoặc SĐT..."
            value={kw}
            onChange={(e) => setKw(e.target.value)}
          />

          <SelectField
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            options={[
              { value: 'ALL', label: 'Tất cả vai trò' },
              { value: 'ADMIN', label: 'Quản trị viên (ADMIN)' },
              { value: 'HOST', label: 'Chủ nhà (HOST)' },
              { value: 'GUEST', label: 'Khách thuê (GUEST)' },
            ]}
          />

          <SelectField
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'ALL', label: 'Tất cả trạng thái' },
              { value: 'ACTIVE', label: 'Hoạt động (ACTIVE)' },
              { value: 'LOCKED', label: 'Đang khóa (LOCKED)' },
            ]}
          />
        </div>

        {filteredUsers.length === 0 ? (
          <EmptyState
            title="Không tìm thấy người dùng nào"
            description="Hãy thử thay đổi từ khóa tìm kiếm hoặc chọn lọc trạng thái/vai trò khác."
          />
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>NGƯỜI DÙNG</TableHeaderCell>
                <TableHeaderCell>VAI TRÒ (ROLE)</TableHeaderCell>
                <TableHeaderCell>SỐ ĐIỆN THOẠI</TableHeaderCell>
                <TableHeaderCell>EMAIL</TableHeaderCell>
                <TableHeaderCell>TRẠNG THÁI</TableHeaderCell>
                <TableHeaderCell align="right">THAO TÁC / QUYỀN HẠN</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map((u) => {
                const isLocked = u.status === 'LOCKED';
                const isSuperAdmin = u.username === 'admin';
                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: '50%',
                            background:
                              u.role === 'ADMIN'
                                ? 'linear-gradient(135deg, #FF385C 0%, #D70466 100%)'
                                : u.role === 'HOST'
                                ? 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)'
                                : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                            color: '#FFFFFF',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.95rem',
                          }}
                        >
                          {u.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.92rem' }}>{u.fullName}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748B', fontFamily: 'monospace' }}>
                            @{u.username}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      {u.role === 'ADMIN' ? (
                        <Badge variant="danger">ADMIN</Badge>
                      ) : u.role === 'HOST' ? (
                        <Badge variant="info">HOST</Badge>
                      ) : (
                        <Badge variant="success">GUEST</Badge>
                      )}
                    </TableCell>

                    <TableCell>
                      <span style={{ fontSize: '0.88rem', color: '#334155' }}>{u.phone}</span>
                    </TableCell>

                    <TableCell>
                      <span style={{ fontSize: '0.88rem', color: '#334155' }}>{u.email}</span>
                    </TableCell>

                    <TableCell>
                      {isLocked ? (
                        <Badge variant="danger">Đang khóa</Badge>
                      ) : (
                        <Badge variant="success">Hoạt động</Badge>
                      )}
                    </TableCell>

                    <TableCell align="right">
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.45rem', alignItems: 'center' }}>
                        {/* Role Selector */}
                        <select
                          value={u.role}
                          disabled={isSuperAdmin}
                          onChange={(e) => handleChangeRole(u, e.target.value as any)}
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            borderRadius: 6,
                            border: '1px solid #CBD5E1',
                            padding: '0.25rem 0.5rem',
                            background: isSuperAdmin ? '#F1F5F9' : '#FFFFFF',
                            cursor: isSuperAdmin ? 'not-allowed' : 'pointer',
                          }}
                        >
                          <option value="GUEST">GUEST (Khách)</option>
                          <option value="HOST">HOST (Chủ nhà)</option>
                          <option value="ADMIN">ADMIN (Quản trị)</option>
                        </select>

                        {/* Lock / Unlock Toggle Button */}
                        <Button
                          variant={isLocked ? 'outline' : 'outline'}
                          size="xs"
                          disabled={isSuperAdmin}
                          onClick={() => handleToggleStatus(u)}
                          style={{
                            color: isLocked ? '#10B981' : '#B91C1C',
                            borderColor: isLocked ? '#10B981' : '#FCA5A5',
                          }}
                        >
                          {isLocked ? <UnlockFill /> : <LockFill />}
                          <span>{isLocked ? 'Mở khóa' : 'Khóa'}</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Modal: Add New User */}
      {showAddForm && (
        <Modal
          isOpen={showAddForm}
          onClose={() => setShowAddForm(false)}
          title="Tạo mới tài khoản người dùng (Admin User Creation)"
          size="md"
        >
          <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <InputField
              label="Họ và tên đầy đủ"
              required
              value={newFullName}
              onChange={(e) => setNewFullName(e.target.value)}
              placeholder="VD: Hoàng Văn Hưng"
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <InputField
                label="Tên đăng nhập"
                required
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="hung.hoang"
              />

              <InputField
                label="Mật khẩu khởi tạo"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="123"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <InputField
                label="Số điện thoại"
                required
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="0912345678"
              />

              <InputField
                label="Email liên hệ"
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="hung@gmail.com"
              />
            </div>

            <SelectField
              label="Vai trò ban đầu"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as any)}
              options={[
                { value: 'GUEST', label: 'GUEST (Khách thuê đặt phòng)' },
                { value: 'HOST', label: 'HOST (Chủ nhà đăng tin homestay)' },
                { value: 'ADMIN', label: 'ADMIN (Quản trị viên hệ thống)' },
              ]}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.5rem' }}>
              <Button variant="secondary" type="button" onClick={() => setShowAddForm(false)}>
                Hủy bỏ
              </Button>
              <Button variant="primary" type="submit" style={{ background: 'linear-gradient(135deg, #FF385C 0%, #E00B41 100%)' }}>
                Xác nhận tạo tài khoản
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
