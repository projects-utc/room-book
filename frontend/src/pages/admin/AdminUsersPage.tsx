// UC-10: Admin User Management & RBAC Page (Standardized Components)
import React, { useState } from 'react';
import { useStore } from '../../contexts/StoreContext';
import {
  Breadcrumb,
  Button,
  Card,
  InputField,
  SelectField,
  Modal,
  StatCard,
  Badge,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
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

  const activeCount = users.filter(u => u.status === 'ACTIVE').length;
  const lockedCount = users.filter(u => u.status === 'LOCKED').length;

  const filteredUsers = users.filter(u => {
    const matchKw =
      !kw ||
      u.fullName.toLowerCase().includes(kw.toLowerCase()) ||
      u.username.toLowerCase().includes(kw.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(kw.toLowerCase());
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchStatus = statusFilter === 'ALL' || u.status === statusFilter;
    return matchKw && matchRole && matchStatus;
  });

  return (
    <div style={{ maxWidth: 1240, margin: '2rem auto', padding: '0 1.5rem' }}>
      <Breadcrumb
        items={[
          { label: 'Admin Console', to: '/admin/users' },
          { label: 'Quản lý tài khoản & RBAC' },
        ]}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem', margin: '1rem 0 2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0 0 0.35rem', color: '#1E293B' }}>
            Quản lý tài khoản &amp; Phân quyền RBAC
          </h1>
          <p style={{ margin: 0, color: '#64748B', fontSize: '0.95rem' }}>
            Kiểm soát tài khoản, thay đổi quyền hạn và khóa người dùng vi phạm. Bảo đảm quy tắc an toàn ASSUM-01.
          </p>
        </div>
        <Button variant="primary" icon={<PersonPlusFill />} onClick={() => setShowAddForm(true)}>
          Tạo tài khoản nội bộ
        </Button>
      </div>

      {/* Standard KPI Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <StatCard
          label="Tổng số tài khoản"
          value={`${users.length} tài khoản`}
          sublabel="Toàn bộ thành viên trong CSDL"
          accent="brand"
          icon={<PeopleFill />}
        />
        <StatCard
          label="Đang hoạt động bình thường"
          value={`${activeCount} tài khoản`}
          sublabel="Trạng thái ACTIVE"
          accent="ok"
          icon={<CheckCircleFill />}
        />
        <StatCard
          label="Đang bị khóa truy cập"
          value={`${lockedCount} tài khoản`}
          sublabel="Tài khoản vi phạm quy chuẩn (LOCKED)"
          accent="danger"
          icon={<ExclamationOctagonFill />}
        />
      </div>

      {/* Filter Controls Card */}
      <Card style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
          <InputField
            label="Tìm kiếm người dùng"
            id="user-kw"
            icon={<Search />}
            value={kw}
            onChange={e => setKw(e.target.value)}
            placeholder="Tìm theo họ tên, username, email..."
          />
          <SelectField
            label="Phân quyền (Role)"
            id="user-role"
            icon={<ShieldLock />}
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            options={[
              { value: 'ALL', label: 'Tất cả vai trò' },
              { value: 'ADMIN', label: 'ADMIN (Quản trị viên)' },
              { value: 'HOST', label: 'HOST (Đối tác chủ nhà)' },
              { value: 'GUEST', label: 'GUEST (Khách lưu trú)' },
            ]}
          />
          <SelectField
            label="Trạng thái hoạt động"
            id="user-status"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            options={[
              { value: 'ALL', label: 'Tất cả trạng thái' },
              { value: 'ACTIVE', label: 'ACTIVE (Đang hoạt động)' },
              { value: 'LOCKED', label: 'LOCKED (Đang bị khóa)' },
            ]}
          />
        </div>
      </Card>

      {/* Standard Table Card */}
      <Card
        title={`Danh sách người dùng (${filteredUsers.length})`}
        headerRight={
          <Badge variant="success" dot icon={<ShieldCheck />}>
            Chuẩn RBAC
          </Badge>
        }
      >
        {filteredUsers.length === 0 ? (
          <EmptyState
            compact
            icon={<PeopleFill />}
            title="Không tìm thấy người dùng phù hợp"
            description="Hãy thử thay đổi từ khóa hoặc bộ lọc trạng thái để xem thêm kết quả."
          />
        ) : (
          <Table hover>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Thành viên</TableHeaderCell>
                <TableHeaderCell>Tên đăng nhập</TableHeaderCell>
                <TableHeaderCell>Số điện thoại</TableHeaderCell>
                <TableHeaderCell>Vai trò RBAC</TableHeaderCell>
                <TableHeaderCell>Trạng thái</TableHeaderCell>
                <TableHeaderCell align="right">Thao tác</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map(u => (
                <TableRow key={u.id}>
                  <TableCell>
                    <strong style={{ display: 'block', color: '#1E293B' }}>{u.fullName}</strong>
                    <span style={{ fontSize: '0.8rem', color: '#64748B' }}>{u.email}</span>
                  </TableCell>
                  <TableCell>
                    <code style={{ background: '#F1F5F9', padding: '2px 6px', borderRadius: 4, fontSize: '0.88rem' }}>
                      {u.username}
                    </code>
                  </TableCell>
                  <TableCell>{u.phone}</TableCell>
                  <TableCell>
                    <select
                      value={u.role}
                      onChange={e => handleChangeRole(u, e.target.value as any)}
                      style={{
                        padding: '0.35rem 0.65rem',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        borderRadius: 6,
                        border: '1px solid #CBD5E1',
                        background: '#ffffff',
                      }}
                    >
                      <option value="ADMIN">ADMIN</option>
                      <option value="HOST">HOST</option>
                      <option value="GUEST">GUEST</option>
                    </select>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.status === 'ACTIVE' ? 'active' : 'danger'} dot>
                      {u.status}
                    </Badge>
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="xs"
                      variant={u.status === 'ACTIVE' ? 'outline' : 'primary'}
                      icon={u.status === 'ACTIVE' ? <LockFill /> : <UnlockFill />}
                      style={u.status === 'ACTIVE' ? { color: '#DC2626', borderColor: '#FECACA' } : {}}
                      onClick={() => handleToggleStatus(u)}
                    >
                      {u.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Standard Modal for Add User */}
      <Modal
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        title="Thêm tài khoản người dùng mới"
        subtitle="Khởi tạo tài khoản nội bộ và thiết lập quyền truy cập hệ thống"
        size="md"
        footer={
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', width: '100%' }}>
            <Button variant="outline" onClick={() => setShowAddForm(false)}>
              Hủy
            </Button>
            <Button variant="primary" onClick={handleAddUser as any}>
              Tạo tài khoản
            </Button>
          </div>
        }
      >
        <form onSubmit={handleAddUser}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <InputField
              label="Họ và tên"
              required
              value={newFullName}
              onChange={e => setNewFullName(e.target.value)}
              placeholder="Ví dụ: Hoàng Đức Minh"
            />
            <InputField
              label="Tên đăng nhập"
              required
              value={newUsername}
              onChange={e => setNewUsername(e.target.value)}
              placeholder="Ví dụ: minh.hoang"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <InputField
              label="Số điện thoại"
              required
              value={newPhone}
              onChange={e => setNewPhone(e.target.value)}
              placeholder="0912345678"
            />
            <InputField
              label="Email liên hệ"
              type="email"
              required
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              placeholder="minh@odauday.vn"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <InputField
              label="Mật khẩu ban đầu"
              type="password"
              required
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
            />
            <SelectField
              label="Phân quyền (RBAC)"
              required
              value={newRole}
              onChange={e => setNewRole(e.target.value as any)}
              options={[
                { value: 'GUEST', label: 'GUEST (Khách thuê homestay)' },
                { value: 'HOST', label: 'HOST (Đối tác chủ nhà)' },
                { value: 'ADMIN', label: 'ADMIN (Quản trị viên hệ thống)' },
              ]}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
