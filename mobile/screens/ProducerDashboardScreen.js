import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Dimensions, Image
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadow, borderRadius } from '../theme';

const { width } = Dimensions.get('window');
const API_URL = 'https://onebohol-production.up.railway.app';

export default function ProducerDashboardScreen({ userId, onBack }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_URL}/producer/dashboard/${userId}`);
      setData(res.data);
    } catch (err) {
      console.error("Dashboard Error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) return (
    <View style={styles.center}><ActivityIndicator size="large" color="#4CAF50" /></View>
  );

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Harvest Partner</Text>
        <TouchableOpacity style={styles.notifBtn}>
          <Ionicons name="notifications-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* REVENUE CARD */}
        <View style={styles.revenueCard}>
          <Text style={styles.revLabel}>Total Revenue</Text>
          <Text style={styles.revAmount}>₱{data?.stats?.total_revenue?.toLocaleString() || '0'}</Text>
          <View style={styles.revBadge}>
            <Text style={styles.revBadgeText}>Growth +12%</Text>
          </View>
        </View>

        {/* STATS GRID */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Ionicons name="cube-outline" size={24} color="#4CAF50" />
            <Text style={styles.statVal}>{data?.stats?.total_products}</Text>
            <Text style={styles.statLabel}>Products</Text>
          </View>
          <View style={[styles.statBox, { borderColor: '#2196F3' }]}>
            <Ionicons name="receipt-outline" size={24} color="#2196F3" />
            <Text style={styles.statVal}>{data?.stats?.total_orders}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
        </View>

        {/* QUICK ACTIONS */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="add-circle" size={32} color="#4CAF50" />
            <Text style={styles.actionText}>Add Product</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="list" size={32} color="#FF9800" />
            <Text style={styles.actionText}>Manage Menu</Text>
          </TouchableOpacity>
        </View>

        {/* RECENT ORDERS */}
        <Text style={styles.sectionTitle}>Recent Orders</Text>
        {data?.recent_orders?.length === 0 ? (
          <View style={styles.empty}><Text>No orders yet</Text></View>
        ) : (
          data.recent_orders.map((order, idx) => (
            <TouchableOpacity key={idx} style={styles.orderCard}>
              <View style={styles.orderTop}>
                <Text style={styles.orderId}>Order #{order.order_id}</Text>
                <Text style={[styles.status, { color: order.status === 'pending' ? '#FF9800' : '#4CAF50' }]}>
                  {order.status.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.orderCustomer}>👤 {order.buyer_name}</Text>
              <Text style={styles.orderPrice}>₱{order.grand_total}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 50, paddingHorizontal: 20, paddingBottom: 15, backgroundColor: '#FFF'
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#333' },
  scrollContent: { padding: 20 },
  revenueCard: {
    backgroundColor: '#1A1A1A', borderRadius: 24, padding: 25, marginBottom: 20,
    ...shadow
  },
  revLabel: { color: '#AAA', fontSize: 14, fontWeight: '600' },
  revAmount: { color: '#FFF', fontSize: 36, fontWeight: '900', marginVertical: 5 },
  revBadge: { alignSelf: 'flex-start', backgroundColor: '#4CAF5033', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  revBadgeText: { color: '#4CAF50', fontSize: 12, fontWeight: 'bold' },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statBox: {
    backgroundColor: '#FFF', width: '48%', padding: 15, borderRadius: 20,
    borderWidth: 1, borderColor: '#E0E0E0', alignItems: 'center'
  },
  statVal: { fontSize: 22, fontWeight: '900', color: '#333', marginTop: 5 },
  statLabel: { fontSize: 12, color: '#666' },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 15, marginTop: 10 },
  actionsRow: { flexDirection: 'row', gap: 15, marginBottom: 25 },
  actionBtn: {
    backgroundColor: '#FFF', flex: 1, padding: 20, borderRadius: 20,
    alignItems: 'center', borderBottomWidth: 4, borderBottomColor: '#E0E0E0'
  },
  actionText: { marginTop: 8, fontWeight: '700', fontSize: 12 },
  orderCard: {
    backgroundColor: '#FFF', padding: 15, borderRadius: 18, marginBottom: 12,
    borderWidth: 1, borderColor: '#EEE'
  },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  orderId: { fontWeight: 'bold', color: '#333' },
  status: { fontSize: 11, fontWeight: '900' },
  orderCustomer: { color: '#666', fontSize: 14 },
  orderPrice: { fontSize: 16, fontWeight: '900', color: '#4CAF50', marginTop: 5 },
  empty: { padding: 40, alignItems: 'center' }
});