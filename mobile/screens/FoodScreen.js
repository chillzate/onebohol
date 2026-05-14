import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  ScrollView,
  Image,
  StatusBar
} from 'react-native';
import axios from 'axios';
import { colors, fonts, shadow, borderRadius } from '../theme';

const API_URL = 'http://192.168.55.210:8000';

export default function FoodScreen({ userId, onBack }) {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuLoading, setMenuLoading] = useState(false);
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState('1');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [ordering, setOrdering] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Fast Food', 'Carinderia', 'Pizza', 'Cafe'];

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/restaurants`);
      setRestaurants(response.data);
    } catch (error) {
      Alert.alert('Error', 'Could not load restaurants');
    }
    setLoading(false);
  };

  const fetchMenu = async (restaurant) => {
    setSelectedRestaurant(restaurant);
    setMenuLoading(true);
    try {
      const response = await axios.get(
        `${API_URL}/restaurants/${restaurant.id}/menu`
      );
      setMenuItems(response.data);
    } catch (error) {
      Alert.alert('Error', 'Could not load menu');
    }
    setMenuLoading(false);
  };

  const handleOrder = async () => {
    if (!deliveryAddress.trim()) {
      Alert.alert('Error', 'Please enter delivery address');
      return;
    }
    if (!quantity || parseInt(quantity) < 1) {
      Alert.alert('Error', 'Invalid quantity');
      return;
    }
    setOrdering(true);
    try {
      const response = await axios.post(
        `${API_URL}/orders?buyer_id=${userId}`,
        {
          menu_item_id: selectedItem.id,
          quantity: parseInt(quantity),
          order_type: 'food',
          delivery_address: deliveryAddress
        },
        { headers: { 'Content-Type': 'application/json' } }
      );
      Alert.alert(
        'Order Placed! 🎉',
        `${selectedItem.name} x${quantity}\nTotal: ₱${response.data.total_price}\nDelivery: ${deliveryAddress}`,
        [{ text: 'OK', onPress: () => setOrderModalVisible(false) }]
      );
      setQuantity('1');
      setDeliveryAddress('');
    } catch (error) {
      Alert.alert('Error', 'Could not place order. Try again.');
    }
    setOrdering(false);
  };

  const filteredRestaurants = selectedCategory === 'All'
    ? restaurants
    : restaurants.filter(r => r.category === selectedCategory);

  // MENU SCREEN
  if (selectedRestaurant) {
    const menuCategories = ['All', ...new Set(menuItems.map(item => item.category))];
    const [selectedMenuCat, setSelectedMenuCat] = useState('All');

    const filteredMenu = selectedMenuCat === 'All'
      ? menuItems
      : menuItems.filter(item => item.category === selectedMenuCat);

    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={colors.primaryDark} barStyle="light-content" />

        {/* RESTAURANT HEADER */}
        <View style={styles.restaurantHeader}>
          {selectedRestaurant.image_url ? (
            <Image
              source={{ uri: selectedRestaurant.image_url }}
              style={styles.restaurantHeaderImage}
            />
          ) : (
            <View style={styles.restaurantHeaderPlaceholder}>
              <Text style={styles.restaurantHeaderEmoji}>🍔</Text>
            </View>
          )}
          <View style={styles.restaurantHeaderOverlay}>
            <TouchableOpacity
              style={styles.backCircle}
              onPress={() => setSelectedRestaurant(null)}>
              <Text style={styles.backCircleText}>←</Text>
            </TouchableOpacity>
            <View style={styles.restaurantHeaderInfo}>
              <Text style={styles.restaurantHeaderName}>
                {selectedRestaurant.name}
              </Text>
              <Text style={styles.restaurantHeaderAddress}>
                📍 {selectedRestaurant.address}
              </Text>
              <View style={styles.restaurantHeaderBadges}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    🛵 {selectedRestaurant.delivery_range_km}km
                  </Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    💰 ₱{selectedRestaurant.delivery_fee} delivery
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* MENU CATEGORIES */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}>
          {menuCategories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryChip,
                selectedMenuCat === cat && styles.categoryChipActive
              ]}
              onPress={() => setSelectedMenuCat(cat)}>
              <Text style={[
                styles.categoryChipText,
                selectedMenuCat === cat && styles.categoryChipTextActive
              ]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* MENU ITEMS */}
        {menuLoading ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={{ marginTop: 30 }}
          />
        ) : (
          <FlatList
            data={filteredMenu}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.menuList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🍽️</Text>
                <Text style={styles.emptyText}>No items available</Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={styles.menuCard}>
                <View style={styles.menuCardLeft}>
                  <Text style={styles.menuItemName}>{item.name}</Text>
                  <Text style={styles.menuItemDesc}>
                    {item.description || 'No description'}
                  </Text>
                  <Text style={styles.menuItemPrice}>₱{item.price}</Text>
                </View>
                <View style={styles.menuCardRight}>
                  {item.image_url ? (
                    <Image
                      source={{ uri: item.image_url }}
                      style={styles.menuItemImage}
                    />
                  ) : (
                    <View style={styles.menuItemImagePlaceholder}>
                      <Text style={styles.menuItemImageEmoji}>🍽️</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => {
                      setSelectedItem(item);
                      setOrderModalVisible(true);
                    }}>
                    <Text style={styles.addButtonText}>+ Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}

        {/* ORDER MODAL */}
        <Modal
          visible={orderModalVisible}
          transparent
          animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>
                {selectedItem?.name}
              </Text>
              <Text style={styles.modalPrice}>
                ₱{selectedItem?.price} each
              </Text>

              <Text style={styles.modalLabel}>Quantity</Text>
              <View style={styles.quantityRow}>
                <TouchableOpacity
                  style={styles.quantityBtn}
                  onPress={() => setQuantity(
                    String(Math.max(1, parseInt(quantity) - 1))
                  )}>
                  <Text style={styles.quantityBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.quantityValue}>{quantity}</Text>
                <TouchableOpacity
                  style={styles.quantityBtn}
                  onPress={() => setQuantity(
                    String(parseInt(quantity) + 1)
                  )}>
                  <Text style={styles.quantityBtnText}>+</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.modalLabel}>Delivery Address</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter your delivery address"
                placeholderTextColor={colors.textLight}
                value={deliveryAddress}
                onChangeText={setDeliveryAddress}
                multiline
              />

              <View style={styles.modalTotalRow}>
                <Text style={styles.modalTotalLabel}>Total:</Text>
                <Text style={styles.modalTotalValue}>
                  ₱{selectedItem
                    ? (selectedItem.price * (parseInt(quantity) || 0)).toFixed(2)
                    : 0}
                </Text>
              </View>

              {ordering ? (
                <ActivityIndicator
                  size="large"
                  color={colors.primary}
                  style={{ marginVertical: 15 }}
                />
              ) : (
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => {
                      setOrderModalVisible(false);
                      setQuantity('1');
                      setDeliveryAddress('');
                    }}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.confirmBtn}
                    onPress={handleOrder}>
                    <Text style={styles.confirmBtnText}>
                      Place Order 🛵
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // RESTAURANT LIST SCREEN
  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={colors.primaryDark} barStyle="light-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🍔 Food Delivery</Text>
        <Text style={styles.headerSub}>Order from local restaurants</Text>
      </View>

      {/* SEARCH BAR */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchPlaceholder}>
            Search restaurants...
          </Text>
        </View>
      </View>

      {/* CATEGORIES */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.categoryChip,
              selectedCategory === cat && styles.categoryChipActive
            ]}
            onPress={() => setSelectedCategory(cat)}>
            <Text style={[
              styles.categoryChipText,
              selectedCategory === cat && styles.categoryChipTextActive
            ]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* RESTAURANT LIST */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Finding restaurants...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredRestaurants}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.restaurantList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🍔</Text>
              <Text style={styles.emptyText}>No restaurants yet</Text>
              <Text style={styles.emptySubText}>
                Check back soon!
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.restaurantCard}
              onPress={() => fetchMenu(item)}>
              {item.image_url ? (
                <Image
                  source={{ uri: item.image_url }}
                  style={styles.restaurantImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.restaurantImagePlaceholder}>
                  <Text style={styles.restaurantImageEmoji}>🍔</Text>
                </View>
              )}
              <View style={styles.restaurantInfo}>
                <View style={styles.restaurantNameRow}>
                  <Text style={styles.restaurantName}>{item.name}</Text>
                  <View style={styles.openBadge}>
                    <Text style={styles.openBadgeText}>Open</Text>
                  </View>
                </View>
                <Text style={styles.restaurantDesc}>
                  {item.description || 'Local restaurant'}
                </Text>
                <Text style={styles.restaurantAddress}>
                  📍 {item.address}
                </Text>
                <View style={styles.restaurantMeta}>
                  <Text style={styles.restaurantMetaText}>
                    🛵 {item.delivery_range_km}km range
                  </Text>
                  <Text style={styles.restaurantMetaDot}>•</Text>
                  <Text style={styles.restaurantMetaText}>
                    💰 ₱{item.delivery_fee} delivery
                  </Text>
                  <Text style={styles.restaurantMetaDot}>•</Text>
                  <Text style={styles.restaurantCategory}>
                    {item.category}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },

  // HEADER
  header: {
    backgroundColor: colors.primaryDark,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20
  },
  backBtn: {
    color: colors.primaryLight,
    fontSize: fonts.medium,
    marginBottom: 8
  },
  headerTitle: {
    color: colors.textWhite,
    fontSize: fonts.xxlarge,
    fontWeight: 'bold'
  },
  headerSub: {
    color: colors.primaryLight,
    fontSize: fonts.small,
    marginTop: 3
  },

  // SEARCH
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.primaryDark
  },
  searchBar: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: borderRadius.xlarge,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center'
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8
  },
  searchPlaceholder: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: fonts.regular
  },

  // CATEGORIES
  categoryScroll: {
    backgroundColor: colors.cardBackground,
    paddingVertical: 12,
    paddingHorizontal: 15,
    maxHeight: 55,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: borderRadius.round,
    marginRight: 8,
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  categoryChipText: {
    fontSize: fonts.small,
    color: colors.textMedium,
    fontWeight: '600'
  },
  categoryChipTextActive: {
    color: colors.textWhite
  },

  // LOADING
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingText: {
    color: colors.textMedium,
    marginTop: 10,
    fontSize: fonts.regular
  },

  // EMPTY STATE
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 15
  },
  emptyText: {
    fontSize: fonts.large,
    fontWeight: 'bold',
    color: colors.textDark
  },
  emptySubText: {
    fontSize: fonts.regular,
    color: colors.textLight,
    marginTop: 5
  },

  // RESTAURANT LIST
  restaurantList: {
    padding: 15
  },
  restaurantCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.large,
    marginBottom: 15,
    overflow: 'hidden',
    ...shadow
  },
  restaurantImage: {
    width: '100%',
    height: 160
  },
  restaurantImagePlaceholder: {
    width: '100%',
    height: 160,
    backgroundColor: colors.inputBackground,
    alignItems: 'center',
    justifyContent: 'center'
  },
  restaurantImageEmoji: {
    fontSize: 50
  },
  restaurantInfo: {
    padding: 15
  },
  restaurantNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5
  },
  restaurantName: {
    fontSize: fonts.large,
    fontWeight: 'bold',
    color: colors.textDark,
    flex: 1
  },
  openBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.round
  },
  openBadgeText: {
    color: colors.success,
    fontSize: fonts.small,
    fontWeight: 'bold'
  },
  restaurantDesc: {
    fontSize: fonts.small,
    color: colors.textMedium,
    marginBottom: 8
  },
  restaurantAddress: {
    fontSize: fonts.small,
    color: colors.textLight,
    marginBottom: 10
  },
  restaurantMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  restaurantMetaText: {
    fontSize: fonts.small,
    color: colors.textMedium
  },
  restaurantMetaDot: {
    color: colors.textLight,
    marginHorizontal: 5
  },
  restaurantCategory: {
    fontSize: fonts.small,
    color: colors.primary,
    fontWeight: '600'
  },

  // RESTAURANT DETAIL HEADER
  restaurantHeader: {
    height: 220,
    position: 'relative'
  },
  restaurantHeaderImage: {
    width: '100%',
    height: '100%'
  },
  restaurantHeaderPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center'
  },
  restaurantHeaderEmoji: {
    fontSize: 60
  },
  restaurantHeaderOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(44, 24, 16, 0.75)',
    padding: 15
  },
  backCircle: {
    position: 'absolute',
    top: -170,
    left: 15,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  backCircleText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold'
  },
  restaurantHeaderInfo: {
    marginTop: 5
  },
  restaurantHeaderName: {
    color: colors.textWhite,
    fontSize: fonts.xlarge,
    fontWeight: 'bold'
  },
  restaurantHeaderAddress: {
    color: colors.primaryLight,
    fontSize: fonts.small,
    marginTop: 3
  },
  restaurantHeaderBadges: {
    flexDirection: 'row',
    marginTop: 8
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.round,
    marginRight: 8
  },
  badgeText: {
    color: colors.textWhite,
    fontSize: fonts.small
  },

  // MENU LIST
  menuList: {
    padding: 15
  },
  menuCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.large,
    padding: 15,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadow
  },
  menuCardLeft: {
    flex: 1,
    marginRight: 15
  },
  menuItemName: {
    fontSize: fonts.regular,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 5
  },
  menuItemDesc: {
    fontSize: fonts.small,
    color: colors.textLight,
    marginBottom: 8,
    lineHeight: 18
  },
  menuItemPrice: {
    fontSize: fonts.large,
    fontWeight: 'bold',
    color: colors.primary
  },
  menuCardRight: {
    alignItems: 'center'
  },
  menuItemImage: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.medium,
    marginBottom: 8
  },
  menuItemImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.medium,
    backgroundColor: colors.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8
  },
  menuItemImageEmoji: {
    fontSize: 35
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: borderRadius.round,
    ...shadow
  },
  addButtonText: {
    color: colors.textWhite,
    fontWeight: 'bold',
    fontSize: fonts.small
  },

  // ORDER MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: colors.cardBackground,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 25,
    paddingBottom: 40
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20
  },
  modalTitle: {
    fontSize: fonts.xlarge,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 5
  },
  modalPrice: {
    fontSize: fonts.medium,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 20
  },
  modalLabel: {
    fontSize: fonts.small,
    fontWeight: 'bold',
    color: colors.textMedium,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20
  },
  quantityBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  quantityBtnText: {
    color: colors.textWhite,
    fontSize: 22,
    fontWeight: 'bold',
    lineHeight: 26
  },
  quantityValue: {
    fontSize: fonts.xlarge,
    fontWeight: 'bold',
    color: colors.textDark,
    marginHorizontal: 20,
    minWidth: 30,
    textAlign: 'center'
  },
  modalInput: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.medium,
    padding: 14,
    fontSize: fonts.regular,
    color: colors.textDark,
    marginBottom: 20,
    minHeight: 50
  },
  modalTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  modalTotalLabel: {
    fontSize: fonts.large,
    color: colors.textMedium,
    fontWeight: '600'
  },
  modalTotalValue: {
    fontSize: fonts.xxlarge,
    fontWeight: 'bold',
    color: colors.primaryDark
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  cancelBtn: {
    flex: 1,
    padding: 15,
    borderRadius: borderRadius.large,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    marginRight: 10
  },
  cancelBtnText: {
    color: colors.textMedium,
    fontWeight: '600',
    fontSize: fonts.regular
  },
  confirmBtn: {
    flex: 2,
    padding: 15,
    borderRadius: borderRadius.large,
    backgroundColor: colors.primary,
    alignItems: 'center',
    ...shadow
  },
  confirmBtnText: {
    color: colors.textWhite,
    fontWeight: 'bold',
    fontSize: fonts.regular
  }
});