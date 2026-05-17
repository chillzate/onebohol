// ============================================
// ZAVARA ADMIN DASHBOARD - v1.0
// The Overseer's Command Center 🌴
// Inspired by: Shopee Seller Center Admin
//              Grab Operations Dashboard
// ============================================
import {
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import axios from 'axios';
import * as Haptics from 'expo-haptics';
import {
  colors,
  shadow,
  shadowMd,
  shadowGold,
  shadowDark,
  borderRadius,
} from '../theme';
import { API_URL }   from '../config';
import { showToast } from './ToastManager';
import { ConfirmModal } from './CustomToast';

// ============================================
// CONSTANTS
// ============================================
const ROLE_CONFIG = {
  producer:  {
    label: 'Harvest Partner',
    icon:  '🌾',
    color: colors.farmerColor,
    bg:    colors.farmerBg,
  },
  seller:    {
    label: 'Market Seller',
    icon:  '🏪',
    color: colors.vendorColor,
    bg:    colors.vendorBg,
  },
  transport: {
    label: 'Swift Partner',
    icon:  '🚐',
    color: colors.riderColor,
    bg:    colors.riderBg,
  },
  haven:     {
    label: 'Haven Partner',
    icon:  '🏨',
    color: colors.havenColor,
    bg:    colors.havenBg,
  },
  cuisine:   {
    label: 'Cuisine Partner',
    icon:  '🍴',
    color: colors.cuisineColor,
    bg:    colors.cuisineBg,
  },
  regular:   {
    label: 'Member',
    icon:  '👤',
    color: colors.textMedium,
    bg:    colors.inputBackground,
  },
  admin:     {
    label: 'Overseer',
    icon:  '⚙️',
    color: colors.adminColor,
    bg:    colors.adminBg,
  },
};

const TABS = [
  { id: 'overview',      label: '📊 Overview'      },
  { id: 'verifications', label: '✅ Verify'         },
  { id: 'products',      label: '🌾 Products'       },
  { id: 'users',         label: '👥 Users'          },
];

// ============================================
// STAT CARD - reusable
// ============================================
function StatCard({ emoji, label, value, color, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.statCard,
        { borderTopColor: color || colors.primary }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.85 : 1}>
      <Text style={styles.statCardEmoji}>{emoji}</Text>
      <Text style={[styles.statCardValue,
        { color: color || colors.primary }]}>
        {value ?? '—'}
      </Text>
      <Text style={styles.statCardLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// ============================================
// VERIFICATION CARD
// ============================================
function VerificationCard({
  item,
  onApprove,
  onReject,
  processing,
}) {
  const roleInfo = ROLE_CONFIG[item.requested_role] ||
    ROLE_CONFIG.regular;

  return (
    <View style={styles.verifyCard}>
      {/* Header */}
      <View style={styles.verifyCardHeader}>
        <View style={styles.verifyCardLeft}>
          <View style={[styles.verifyRoleIcon,
            { backgroundColor: roleInfo.bg }]}>
            <Text style={{ fontSize: 24 }}>
              {roleInfo.icon}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.verifyCardName}>
              {item.user_name || `User #${item.user_id}`}
            </Text>
            <Text style={styles.verifyCardEmail}>
              {item.user_email || '—'}
            </Text>
          </View>
        </View>
        <View style={[styles.verifyRoleBadge,
          { backgroundColor: roleInfo.bg,
            borderColor: roleInfo.color + '40' }]}>
          <Text style={[styles.verifyRoleBadgeText,
            { color: roleInfo.color }]}>
            {roleInfo.label}
          </Text>
        </View>
      </View>

      {/* Details */}
      <View style={styles.verifyCardBody}>
        {item.business_name &&
          item.business_name !== 'Pending' && (
          <View style={styles.verifyRow}>
            <Text style={styles.verifyRowLabel}>
              Business
            </Text>
            <Text style={styles.verifyRowValue}>
              {item.business_name}
            </Text>
          </View>
        )}
        {item.partner_type && (
          <View style={styles.verifyRow}>
            <Text style={styles.verifyRowLabel}>Type</Text>
            <Text style={styles.verifyRowValue}>
              {item.partner_type.replace('_', ' ')}
            </Text>
          </View>
        )}
        <View style={styles.verifyRow}>
          <Text style={styles.verifyRowLabel}>
            Applied
          </Text>
          <Text style={styles.verifyRowValue}>
            {item.created_at
              ? new Date(item.created_at)
                .toLocaleDateString('en-PH', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '—'}
          </Text>
        </View>
      </View>

      {/* Actions */}
      {processing === item.id ? (
        <View style={styles.verifyProcessing}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.verifyProcessingText}>
            Processing...
          </Text>
        </View>
      ) : (
        <View style={styles.verifyActions}>
          <TouchableOpacity
            style={styles.rejectBtn}
            onPress={() => onReject(item)}
            activeOpacity={0.85}>
            <Text style={styles.rejectBtnText}>
              ✕ Reject
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.approveBtn}
            onPress={() => onApprove(item)}
            activeOpacity={0.85}>
            <Text style={styles.approveBtnText}>
              ✓ Approve
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ============================================
// PRODUCT APPROVAL CARD
// ============================================
function ProductApprovalCard({
  item,
  onApprove,
  onReject,
  processing,
}) {
  const CATEGORY_EMOJI = {
    vegetables: '🥦', seafood: '🐟',
    rice: '🌾', fruits: '🍌',
    livestock: '🐄', other: '🌿',
  };
  const emoji =
    CATEGORY_EMOJI[item.category?.toLowerCase()] || '🌴';

  return (
    <View style={styles.productApprovalCard}>
      <View style={styles.productApprovalTop}>
        <View style={styles.productApprovalLeft}>
          {item.image_url ? (
            <Image
              source={{ uri: item.image_url }}
              style={styles.productApprovalImg}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.productApprovalEmoji}>
              <Text style={{ fontSize: 28 }}>{emoji}</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.productApprovalName}>
              {item.name}
            </Text>
            <Text style={styles.productApprovalMeta}>
              ₱{item.price}/{item.unit} ·{' '}
              {item.quantity} in stock
            </Text>
            <Text style={styles.productApprovalSeller}>
              🌾 {item.farmer_name ||
                `Producer #${item.farmer_id}`}
            </Text>
          </View>
        </View>
        <View style={[
          styles.marketTypeBadge,
          {
            backgroundColor:
              item.market_type === 'retail'
                ? colors.primaryPale
                : colors.vendorBg,
          },
        ]}>
          <Text style={[
            styles.marketTypeBadgeText,
            {
              color: item.market_type === 'retail'
                ? colors.primary
                : colors.vendorColor,
            },
          ]}>
            {item.market_type === 'retail'
              ? '🛒 Retail' : '🏪 Wholesale'}
          </Text>
        </View>
      </View>

      {item.description ? (
        <Text
          style={styles.productApprovalDesc}
          numberOfLines={2}>
          {item.description}
        </Text>
      ) : null}

      {processing === item.id ? (
        <View style={styles.verifyProcessing}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.verifyProcessingText}>
            Processing...
          </Text>
        </View>
      ) : (
        <View style={styles.verifyActions}>
          <TouchableOpacity
            style={styles.rejectBtn}
            onPress={() => onReject(item)}
            activeOpacity={0.85}>
            <Text style={styles.rejectBtnText}>
              ✕ Hide
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.approveBtn}
            onPress={() => onApprove(item)}
            activeOpacity={0.85}>
            <Text style={styles.approveBtnText}>
              ✓ Approve
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ============================================
// USER ROW
// ============================================
function UserRow({ item, onChangeRole }) {
  const roleInfo =
    ROLE_CONFIG[item.role] || ROLE_CONFIG.regular;

  return (
    <View style={styles.userRow}>
      <View style={styles.userRowLeft}>
        <View style={styles.userAvatar}>
          {item.profile_image ? (
            <Image
              source={{ uri: item.profile_image }}
              style={styles.userAvatarImg}
            />
          ) : (
            <Text style={styles.userAvatarText}>
              {item.name?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.userName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.userEmail} numberOfLines={1}>
            {item.email}
          </Text>
        </View>
      </View>
      <View style={[styles.userRoleBadge,
        { backgroundColor: roleInfo.bg }]}>
        <Text style={[styles.userRoleBadgeText,
          { color: roleInfo.color }]}>
          {roleInfo.icon} {item.role}
        </Text>
      </View>
    </View>
  );
}

// ============================================
// MAIN ADMIN DASHBOARD
// ============================================
export default function AdminDashboardScreen({
  userId,
  onBack,
}) {
  const [activeTab, setActiveTab]   = useState('overview');
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [stats, setStats]                     = useState(null);
  const [verifications, setVerifications]     = useState([]);
  const [pendingProducts, setPendingProducts] = useState([]);
  const [users, setUsers]                     = useState([]);

  // Loading states
  const [loadingVerify, setLoadingVerify]     = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingUsers, setLoadingUsers]       = useState(false);
  const [processingVerify, setProcessingVerify] = useState(null);
  const [processingProduct, setProcessingProduct] = useState(null);

  // Confirm modal
  const [confirmModal, setConfirmModal] = useState({
    visible:  false,
    title:    '',
    message:  '',
    onConfirm: null,
    dangerous: false,
  });

  // ── FETCH STATS ─────────────────────────────
  const fetchStats = useCallback(async () => {
  if (!userId) return; // ← ADD THIS!
  try {
    const res = await axios.get(
      `${API_URL}/admin/stats?user_id=${userId}`,
      { timeout: 20000 } // ← increase!
    );
    setStats(res.data);
  } catch {
    setStats({
      total_users:           '—',
      total_orders:          '—',
      pending_verifications: 0,
      pending_products:      0,
      total_revenue:         '—',
    });
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
}, [userId]);

  // ── FETCH VERIFICATIONS ──────────────────────
  const fetchVerifications = useCallback(async () => {
  if (!userId) return; //  GUARD CLAUSE: Kung walang userId, EXIT AGAD! Protektado ang app mo dito.

  setLoadingVerify(true); // 2. Tatakbo lang ito kapag 100% siguradong may valid na userId na.
  try {
    const res = await axios.get(
      `${API_URL}/verify/pending?user_id=${userId}`, // 3. Garantisadong may tamang ID na ipapasa sa backend.
      { timeout: 10000 }
    );
    setVerifications(res.data || []);
  } catch {
    setVerifications([]);
  } finally {
    setLoadingVerify(false);
  }
}, [userId]);

  // ── FETCH PENDING PRODUCTS ───────────────────
  const fetchPendingProducts = useCallback(async () => {
  if (!userId) return; //  Hinarang agad! Kung walang ID, walang biyahe ang network request.

  setLoadingProducts(true);
  try {
    const res = await axios.get(
      `${API_URL}/admin/products/pending?user_id=${userId}`, // Guaranteed na may valid na userId na itong kasama
      { timeout: 10000 }
    );
    setPendingProducts(res.data?.products || []);
  } catch {
    setPendingProducts([]);
  } finally {
    setLoadingProducts(false);
  }
}, [userId]);

  // ── FETCH USERS ──────────────────────────────
  const fetchUsers = useCallback(async () => {
  if (!userId) return; //  Hinarang agad! Ligtas ang listahan ng mga users.

  setLoadingUsers(true);
  try {
    const res = await axios.get(
      `${API_URL}/admin/users?user_id=${userId}`, // Garantisadong may tamang ID na
      { timeout: 10000 }
    );
    setUsers(res.data?.users || []);
  } catch {
    setUsers([]);
  } finally {
    setLoadingUsers(false);
  }
}, [userId]);

  // ── STARTUP ──────────────────────────────────
  useEffect(() => {
  if (userId) fetchStats();
}, [userId]); // ← watches for userId!

  useEffect(() => {
    if (activeTab === 'verifications') fetchVerifications();
    if (activeTab === 'products')      fetchPendingProducts();
    if (activeTab === 'users')         fetchUsers();
  }, [activeTab]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStats();
    if (activeTab === 'verifications') fetchVerifications();
    if (activeTab === 'products')      fetchPendingProducts();
    if (activeTab === 'users')         fetchUsers();
  }, [activeTab]);

  // ── SHOW CONFIRM ─────────────────────────────
  const showConfirm = useCallback(({
    title, message, onConfirm, dangerous = false
  }) => {
    setConfirmModal({
      visible: true,
      title, message, onConfirm, dangerous,
    });
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmModal(prev => ({
      ...prev, visible: false,
    }));
  }, []);

  // ── APPROVE VERIFICATION ─────────────────────
  const handleApproveVerification = useCallback((item) => {
    const roleInfo =
      ROLE_CONFIG[item.requested_role] || {};
    showConfirm({
      title:   `Approve ${roleInfo.label || 'Partner'}?`,
      message: `Grant ${item.user_name || 'this user'} the role of ${roleInfo.label || item.requested_role}?`,
      dangerous: false,
      onConfirm: async () => {
        setProcessingVerify(item.id);
        try {
          await axios.patch(
            `${API_URL}/verify/${item.id}/approve` +
            `?user_id=${userId}`
          );
          Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success
          ).catch(() => {});
          showToast('success', 'Partner Approved! ✅',
            `${item.user_name} is now a ${roleInfo.label}`
          );
          fetchVerifications();
          fetchStats();
        } catch (err) {
          showToast('error', 'Error',
            err.response?.data?.detail ||
            'Could not approve. Try again.'
          );
        } finally {
          setProcessingVerify(null);
        }
      },
    });
  }, [userId, fetchVerifications, fetchStats, showConfirm]);

  // ── REJECT VERIFICATION ──────────────────────
  const handleRejectVerification = useCallback((item) => {
    showConfirm({
      title:    'Reject Application?',
      message:  `Reject ${item.user_name || 'this user'}'s partner application? They will remain as a regular member.`,
      dangerous: true,
      onConfirm: async () => {
        setProcessingVerify(item.id);
        try {
          await axios.patch(
            `${API_URL}/verify/${item.id}/reject` +
            `?user_id=${userId}`
          );
          Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Warning
          ).catch(() => {});
          showToast('info', 'Application Rejected',
            `${item.user_name}'s application was rejected`
          );
          fetchVerifications();
          fetchStats();
        } catch {
          showToast('error', 'Error',
            'Could not reject. Try again.');
        } finally {
          setProcessingVerify(null);
        }
      },
    });
  }, [userId, fetchVerifications, fetchStats, showConfirm]);

  // ── APPROVE PRODUCT ──────────────────────────
  const handleApproveProduct = useCallback((item) => {
    showConfirm({
      title:   'Approve Product?',
      message: `Approve "${item.name}" for listing on ZAVARA Market?`,
      dangerous: false,
      onConfirm: async () => {
        setProcessingProduct(item.id);
        try {
          await axios.patch(
            `${API_URL}/admin/products/${item.id}/approve` +
            `?user_id=${userId}`
          );
          Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success
          ).catch(() => {});
          showToast('success', 'Product Approved! ✅',
            `${item.name} is now live on the market`
          );
          fetchPendingProducts();
          fetchStats();
        } catch {
          showToast('error', 'Error',
            'Could not approve product.');
        } finally {
          setProcessingProduct(null);
        }
      },
    });
  }, [userId, fetchPendingProducts, fetchStats, showConfirm]);

  // ── REJECT PRODUCT ───────────────────────────
  const handleRejectProduct = useCallback((item) => {
    showConfirm({
      title:    'Hide Product?',
      message:  `Hide "${item.name}" from the market? The producer will be notified.`,
      dangerous: true,
      onConfirm: async () => {
        setProcessingProduct(item.id);
        try {
          await axios.patch(
            `${API_URL}/admin/products/${item.id}/reject` +
            `?user_id=${userId}`
          );
          Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Warning
          ).catch(() => {});
          showToast('info', 'Product Hidden',
            `${item.name} has been hidden`
          );
          fetchPendingProducts();
          fetchStats();
        } catch {
          showToast('error', 'Error',
            'Could not hide product.');
        } finally {
          setProcessingProduct(null);
        }
      },
    });
  }, [userId, fetchPendingProducts, fetchStats, showConfirm]);

  // ── PENDING COUNTS ───────────────────────────
  const pendingCount = useMemo(() => ({
    verifications: verifications.length,
    products:      pendingProducts.length,
  }), [verifications, pendingProducts]);

  // ============================================
  // OVERVIEW TAB
  // ============================================
  const OverviewTab = () => (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.adminColor]}
          tintColor={colors.adminColor}
        />
      }>

      {/* WELCOME CARD */}
      <View style={styles.welcomeCard}>
        <View style={styles.welcomeLeft}>
          <Text style={styles.welcomeEmoji}>⚙️</Text>
          <View>
            <Text style={styles.welcomeTitle}>
              Overseer Dashboard
            </Text>
            <Text style={styles.welcomeSub}>
              ZAVARA Command Center
            </Text>
          </View>
        </View>
        <View style={styles.welcomeBadge}>
          <Text style={styles.welcomeBadgeText}>
            🌴 LIVE
          </Text>
        </View>
      </View>

      {/* URGENT ACTIONS */}
      {(pendingCount.verifications > 0 ||
        pendingCount.products > 0) && (
        <View style={styles.urgentSection}>
          <Text style={styles.urgentTitle}>
            ⚠️ NEEDS ATTENTION
          </Text>
          {pendingCount.verifications > 0 && (
            <TouchableOpacity
              style={styles.urgentCard}
              onPress={() => setActiveTab('verifications')}
              activeOpacity={0.85}>
              <Text style={styles.urgentIcon}>✅</Text>
              <View style={styles.urgentContent}>
                <Text style={styles.urgentCardTitle}>
                  {pendingCount.verifications} Partner
                  {pendingCount.verifications > 1
                    ? 's' : ''} waiting approval
                </Text>
                <Text style={styles.urgentCardSub}>
                  Tap to review applications
                </Text>
              </View>
              <Text style={styles.urgentArrow}>→</Text>
            </TouchableOpacity>
          )}
          {pendingCount.products > 0 && (
            <TouchableOpacity
              style={[styles.urgentCard, {
                borderColor: colors.farmerColor + '30',
                backgroundColor: colors.farmerBg,
              }]}
              onPress={() => setActiveTab('products')}
              activeOpacity={0.85}>
              <Text style={styles.urgentIcon}>🌾</Text>
              <View style={styles.urgentContent}>
                <Text style={[styles.urgentCardTitle,
                  { color: colors.farmerColor }]}>
                  {pendingCount.products} Product
                  {pendingCount.products > 1
                    ? 's' : ''} need approval
                </Text>
                <Text style={styles.urgentCardSub}>
                  Tap to review products
                </Text>
              </View>
              <Text style={[styles.urgentArrow,
                { color: colors.farmerColor }]}>→</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* STATS GRID */}
      <Text style={styles.sectionTitle}>Platform Stats</Text>
      <View style={styles.statsGrid}>
        <StatCard
          emoji="👥"
          label="Total Users"
          value={stats?.total_users}
          color={colors.riderColor}
          onPress={() => setActiveTab('users')}
        />
        <StatCard
          emoji="📦"
          label="Orders"
          value={stats?.total_orders}
          color={colors.success}
        />
        <StatCard
          emoji="⏳"
          label="Pending Verify"
          value={pendingCount.verifications}
          color={colors.warning}
          onPress={() => setActiveTab('verifications')}
        />
        <StatCard
          emoji="🌾"
          label="Pending Products"
          value={pendingCount.products}
          color={colors.farmerColor}
          onPress={() => setActiveTab('products')}
        />
      </View>

      {/* REVENUE CARD */}
      {stats?.total_revenue !== '—' && (
        <View style={styles.revenueCard}>
          <View style={styles.revenueTop}>
            <Text style={styles.revenueLabel}>
              Platform Revenue
            </Text>
            <View style={styles.revenueBadge}>
              <Text style={styles.revenueBadgeText}>
                ⚙️ Admin View
              </Text>
            </View>
          </View>
          <Text style={styles.revenueValue}>
            ₱{typeof stats?.total_revenue === 'number'
              ? stats.total_revenue.toLocaleString('en-PH', {
                  minimumFractionDigits: 2,
                })
              : stats?.total_revenue || '0.00'}
          </Text>
          <Text style={styles.revenueSub}>
            Total transactions processed
          </Text>
        </View>
      )}

      {/* QUICK ACTIONS */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActionsGrid}>
        {[
          {
            icon:  '✅',
            label: 'Review Partners',
            sub:   'Approve applications',
            color: colors.success,
            tab:   'verifications',
          },
          {
            icon:  '🌾',
            label: 'Review Products',
            sub:   'Approve listings',
            color: colors.farmerColor,
            tab:   'products',
          },
          {
            icon:  '👥',
            label: 'Manage Users',
            sub:   'View all members',
            color: colors.riderColor,
            tab:   'users',
          },
        ].map((action) => (
          <TouchableOpacity
            key={action.tab}
            style={[styles.quickActionCard,
              { borderTopColor: action.color }]}
            onPress={() => setActiveTab(action.tab)}
            activeOpacity={0.85}>
            <Text style={styles.quickActionIcon}>
              {action.icon}
            </Text>
            <Text style={styles.quickActionLabel}>
              {action.label}
            </Text>
            <Text style={styles.quickActionSub}>
              {action.sub}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ZAVARA INFO */}
      <View style={styles.zavaraBanner}>
        <Text style={styles.zavaraBannerBrand}>
          ZAVARA
        </Text>
        <Text style={styles.zavaraBannerText}>
          The Island's Pulse 🌴
        </Text>
        <Text style={styles.zavaraBannerSub}>
          Overseer Access · All permissions granted
        </Text>
      </View>

    </ScrollView>
  );

  // ============================================
  // VERIFICATIONS TAB
  // ============================================
  const VerificationsTab = () => (
    <View style={styles.tabContent}>
      {loadingVerify ? (
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color={colors.adminColor}
          />
          <Text style={styles.loadingText}>
            Loading applications...
          </Text>
        </View>
      ) : verifications.length === 0 ? (
        <View style={styles.emptyBig}>
          <Text style={styles.emptyBigIcon}>✅</Text>
          <Text style={styles.emptyBigTitle}>
            All Clear!
          </Text>
          <Text style={styles.emptyBigSub}>
            No pending partner applications.{'\n'}
            You're all caught up!
          </Text>
        </View>
      ) : (
        <FlatList
          data={verifications}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.adminColor]}
              tintColor={colors.adminColor}
            />
          }
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderTitle}>
                {verifications.length} Application
                {verifications.length !== 1 ? 's' : ''}
              </Text>
              <Text style={styles.listHeaderSub}>
                Pending your review
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <VerificationCard
              item={item}
              onApprove={handleApproveVerification}
              onReject={handleRejectVerification}
              processing={processingVerify}
            />
          )}
        />
      )}
    </View>
  );

  // ============================================
  // PRODUCTS TAB
  // ============================================
  const ProductsTab = () => (
    <View style={styles.tabContent}>
      {loadingProducts ? (
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color={colors.adminColor}
          />
          <Text style={styles.loadingText}>
            Loading products...
          </Text>
        </View>
      ) : pendingProducts.length === 0 ? (
        <View style={styles.emptyBig}>
          <Text style={styles.emptyBigIcon}>🌾</Text>
          <Text style={styles.emptyBigTitle}>
            No Pending Products
          </Text>
          <Text style={styles.emptyBigSub}>
            All products have been reviewed!
          </Text>
        </View>
      ) : (
        <FlatList
          data={pendingProducts}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.adminColor]}
              tintColor={colors.adminColor}
            />
          }
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderTitle}>
                {pendingProducts.length} Product
                {pendingProducts.length !== 1 ? 's' : ''}
              </Text>
              <Text style={styles.listHeaderSub}>
                Awaiting approval
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <ProductApprovalCard
              item={item}
              onApprove={handleApproveProduct}
              onReject={handleRejectProduct}
              processing={processingProduct}
            />
          )}
        />
      )}
    </View>
  );

  // ============================================
  // USERS TAB
  // ============================================
  const UsersTab = () => (
    <View style={styles.tabContent}>
      {loadingUsers ? (
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color={colors.adminColor}
          />
          <Text style={styles.loadingText}>
            Loading users...
          </Text>
        </View>
      ) : users.length === 0 ? (
        <View style={styles.emptyBig}>
          <Text style={styles.emptyBigIcon}>👥</Text>
          <Text style={styles.emptyBigTitle}>
            No Users Found
          </Text>
          <Text style={styles.emptyBigSub}>
            User data not available
          </Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.adminColor]}
              tintColor={colors.adminColor}
            />
          }
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderTitle}>
                {users.length} Member
                {users.length !== 1 ? 's' : ''}
              </Text>
              <Text style={styles.listHeaderSub}>
                All registered users
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <UserRow
              item={item}
              onChangeRole={() => {}}
            />
          )}
        />
      )}
    </View>
  );

  // ============================================
  // LOADING STATE
  // ============================================
  if (loading) {
    return (
      <View style={styles.center}>
        <StatusBar
          backgroundColor={colors.headerBg}
          barStyle="dark-content"
        />
        <ActivityIndicator
          size="large"
          color={colors.adminColor}
        />
        <Text style={styles.loadingText}>
          Loading Overseer Dashboard...
        </Text>
      </View>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor={colors.dark}
        barStyle="light-content"
      />

      {/* CONFIRM MODAL */}
      <ConfirmModal
        visible={confirmModal.visible}
        onClose={closeConfirm}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        dangerous={confirmModal.dangerous}
        confirmText={confirmModal.dangerous
          ? 'Yes, Reject' : 'Approve'}
        cancelText="Cancel"
      />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          activeOpacity={0.8}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            ⚙️ Overseer
          </Text>
          <Text style={styles.headerSub}>
            Admin Command Center
          </Text>
        </View>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={() => {
            setRefreshing(true);
            onRefresh();
          }}
          activeOpacity={0.8}>
          <Text style={styles.refreshBtnText}>↻</Text>
        </TouchableOpacity>
      </View>

      {/* TAB BAR */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const badge =
            tab.id === 'verifications'
              ? pendingCount.verifications
              : tab.id === 'products'
                ? pendingCount.products
                : 0;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabItem,
                isActive && styles.tabItemActive]}
              onPress={() => {
                Haptics.impactAsync(
                  Haptics.ImpactFeedbackStyle.Light
                ).catch(() => {});
                setActiveTab(tab.id);
              }}>
              <Text style={[styles.tabLabel,
                isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
              {badge > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>
                    {badge}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* TAB CONTENT */}
      {activeTab === 'overview'      && <OverviewTab />}
      {activeTab === 'verifications' && <VerificationsTab />}
      {activeTab === 'products'      && <ProductsTab />}
      {activeTab === 'users'         && <UsersTab />}

    </View>
  );
}

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: colors.textLight,
    fontSize: 13,
    fontWeight: '600',
  },

  // ── HEADER ──────────────────────────────────
  header: {
    backgroundColor: colors.dark,
    paddingTop: 52,
    paddingBottom: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadowDark,
  },
  backBtn: {
    width: 38, height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  backBtnText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  headerCenter: { flex: 1, paddingHorizontal: 12 },
  headerTitle: {
    color: colors.textCream,
    fontSize: 16,
    fontWeight: '900',
  },
  headerSub: {
    color: 'rgba(255,255,255,0.40)',
    fontSize: 11,
    marginTop: 2,
  },
  refreshBtn: {
    width: 38, height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderGold,
  },
  refreshBtnText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '700',
  },

  // ── TAB BAR ─────────────────────────────────
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    position: 'relative',
  },
  tabItemActive: {
    borderBottomWidth: 3,
    borderBottomColor: colors.adminColor,
  },
  tabLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '700',
  },
  tabLabelActive: {
    color: colors.adminColor,
    fontWeight: '900',
  },
  tabBadge: {
    position: 'absolute',
    top: 4, right: '8%',
    minWidth: 16, height: 16,
    borderRadius: 8,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  tabBadgeText: {
    color: colors.textWhite,
    fontSize: 8,
    fontWeight: '900',
  },
  tabContent: { flex: 1 },

  // ── OVERVIEW ────────────────────────────────
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  welcomeCard: {
    backgroundColor: colors.dark,
    borderRadius: borderRadius.xlarge,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.borderGold,
    ...shadowDark,
  },
  welcomeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  welcomeEmoji: { fontSize: 32 },
  welcomeTitle: {
    color: colors.textCream,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 2,
  },
  welcomeSub: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
  },
  welcomeBadge: {
    backgroundColor: colors.primaryGlow2,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    borderColor: colors.borderGold,
  },
  welcomeBadgeText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
  },

  // ── URGENT SECTION ───────────────────────────
  urgentSection: {
    marginBottom: 20,
    gap: 10,
  },
  urgentTitle: {
    color: colors.warning,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 8,
  },
  urgentCard: {
    backgroundColor: colors.warningPale,
    borderRadius: borderRadius.xlarge,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.warning + '30',
  },
  urgentIcon:    { fontSize: 22 },
  urgentContent: { flex: 1 },
  urgentCardTitle: {
    color: colors.warning,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  urgentCardSub: {
    color: colors.textLight,
    fontSize: 11,
  },
  urgentArrow: {
    color: colors.warning,
    fontSize: 18,
    fontWeight: '900',
  },

  // ── STATS GRID ──────────────────────────────
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.textDark,
    marginBottom: 14,
    letterSpacing: 0.3,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    width: '47%',
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.xlarge,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderTopWidth: 3,
    gap: 4,
    ...shadow,
  },
  statCardEmoji: { fontSize: 24 },
  statCardValue: {
    fontSize: 24,
    fontWeight: '900',
  },
  statCardLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
    textAlign: 'center',
  },

  // ── REVENUE CARD ─────────────────────────────
  revenueCard: {
    backgroundColor: colors.dark,
    borderRadius: borderRadius.xxlarge,
    padding: 22,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.borderGold,
    ...shadowDark,
  },
  revenueTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  revenueLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '600',
  },
  revenueBadge: {
    backgroundColor: colors.adminBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.round,
  },
  revenueBadgeText: {
    color: colors.adminColor,
    fontSize: 10,
    fontWeight: '800',
  },
  revenueValue: {
    color: colors.primary,
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  revenueSub: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
  },

  // ── QUICK ACTIONS ───────────────────────────
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.xlarge,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderTopWidth: 3,
    gap: 4,
    ...shadow,
  },
  quickActionIcon:  { fontSize: 26 },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textDark,
    textAlign: 'center',
  },
  quickActionSub: {
    fontSize: 9,
    color: colors.textMuted,
    textAlign: 'center',
  },

  // ── ZAVARA BANNER ───────────────────────────
  zavaraBanner: {
    backgroundColor: colors.primaryPale,
    borderRadius: borderRadius.xlarge,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderGold,
    gap: 4,
  },
  zavaraBannerBrand: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 6,
  },
  zavaraBannerText: {
    color: colors.textMedium,
    fontSize: 12,
    fontWeight: '600',
  },
  zavaraBannerSub: {
    color: colors.textMuted,
    fontSize: 10,
  },

  // ── LIST ────────────────────────────────────
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  listHeader: {
    marginBottom: 16,
  },
  listHeaderTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textDark,
    marginBottom: 2,
  },
  listHeaderSub: {
    fontSize: 12,
    color: colors.textLight,
  },

  // ── VERIFY CARD ─────────────────────────────
  verifyCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.xxlarge,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadowMd,
  },
  verifyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  verifyCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  verifyRoleIcon: {
    width: 48, height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyCardName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textDark,
    marginBottom: 2,
  },
  verifyCardEmail: {
    fontSize: 11,
    color: colors.textMuted,
  },
  verifyRoleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.round,
    borderWidth: 1,
  },
  verifyRoleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  verifyCardBody: {
    backgroundColor: colors.inputBackground,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  verifyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  verifyRowLabel: {
    width: 60,
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  verifyRowValue: {
    flex: 1,
    color: colors.textDark,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  verifyActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  verifyProcessing: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  verifyProcessingText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  rejectBtn: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    backgroundColor: colors.dangerPale,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  rejectBtnText: {
    color: colors.danger,
    fontWeight: '800',
    fontSize: 13,
  },
  approveBtn: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    backgroundColor: colors.successPale,
  },
  approveBtnText: {
    color: colors.success,
    fontWeight: '900',
    fontSize: 13,
  },

  // ── PRODUCT APPROVAL CARD ────────────────────
  productApprovalCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.xxlarge,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadowMd,
  },
  productApprovalTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  productApprovalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  productApprovalImg: {
    width: 52, height: 52,
    borderRadius: 14,
    backgroundColor: colors.farmerBg,
  },
  productApprovalEmoji: {
    width: 52, height: 52,
    borderRadius: 14,
    backgroundColor: colors.farmerBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productApprovalName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textDark,
    marginBottom: 3,
  },
  productApprovalMeta: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 2,
  },
  productApprovalSeller: {
    fontSize: 10,
    color: colors.farmerColor,
    fontWeight: '700',
  },
  marketTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.round,
  },
  marketTypeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  productApprovalDesc: {
    fontSize: 12,
    color: colors.textLight,
    lineHeight: 18,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },

  // ── USER ROW ─────────────────────────────────
  userRow: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.xlarge,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
    ...shadow,
  },
  userRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  userAvatar: {
    width: 42, height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  userAvatarImg: {
    width: 42, height: 42,
    borderRadius: 21,
  },
  userAvatarText: {
    color: colors.textWhite,
    fontSize: 18,
    fontWeight: '900',
  },
  userName: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textDark,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 10,
    color: colors.textMuted,
  },
  userRoleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.round,
  },
  userRoleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },

  // ── EMPTY ───────────────────────────────────
  emptyBig: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 12,
  },
  emptyBigIcon:  { fontSize: 64 },
  emptyBigTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textDark,
  },
  emptyBigSub: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
});