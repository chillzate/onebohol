import { useState, useEffect } from 'react';
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
  ScrollView
} from 'react-native';
import axios from 'axios';

const API_URL = 'http://192.168.55.210:8000';

export default function MarketScreen({ userId, onBack }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [orderModal, setOrderModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState('1');
  const [ordering, setOrdering] = useState(false);

  const categories = [
    { id: 'all', label: '🌴 All' },
    { id: 'seafood', label: '🐟 Seafood' },
    { id: 'vegetables', label: '🥦 Veggies' },
    { id: 'rice', label: '🌾 Rice' },
    { id: 'fruits', label: '🍌 Fruits' },
  ];

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/products`;
      if (selectedCategory !== 'all') {
        url = `${API_URL}/products/category/${selectedCategory}`;
      }
      const response = await axios.get(url);
      setProducts(response.data);
    } catch (error) {
      Alert.alert('Error', 'Cannot load products');
    }
    setLoading(false);
  };

  const handleOrder = async () => {
    if (!quantity || quantity < 1) {
      Alert.alert('Error', 'Please enter valid quantity');
      return;
    }
    if (parseInt(quantity) > selectedProduct.quantity) {
      Alert.alert(
        'Error',
        `Only ${selectedProduct.quantity} ${selectedProduct.unit} available`
      );
      return;
    }
    setOrdering(true);
    try {
      const response = await axios.post(
        `${API_URL}/orders?buyer_id=${userId}`,
        {
          product_id: selectedProduct.id,
          quantity: parseInt(quantity)
        },
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );
      Alert.alert(
        'Order Placed! 🎉',
        `You ordered ${quantity} ${selectedProduct.unit} of ${selectedProduct.name}\nTotal: ₱${response.data.total_price}`
      );
      setOrderModal(false);
      setQuantity('1');
      fetchProducts();
    } catch (error) {
      Alert.alert('Error', 'Could not place order. Try again.');
    }
    setOrdering(false);
  };

  const renderProduct = ({ item }) => (
    <View style={styles.productCard}>
      <View style={styles.productHeader}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productPrice}>₱{item.price}/{item.unit}</Text>
      </View>
      {item.description ? (
        <Text style={styles.productDesc}>{item.description}</Text>
      ) : null}
      <View style={styles.productFooter}>
        <Text style={styles.productStock}>
          Stock: {item.quantity} {item.unit}
        </Text>
        <TouchableOpacity
          style={styles.orderButton}
          onPress={() => {
            setSelectedProduct(item);
            setOrderModal(true);
          }}>
          <Text style={styles.orderButtonText}>Order Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🛒 OneBohol Market</Text>
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryContainer}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryButton,
              selectedCategory === cat.id && styles.categoryActive
            ]}
            onPress={() => setSelectedCategory(cat.id)}>
            <Text
              style={[
                styles.categoryText,
                selectedCategory === cat.id && styles.categoryTextActive
              ]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Products List */}
      {loading ? (
        <ActivityIndicator
          size="large"
          color="#2E86AB"
          style={styles.loader}
        />
      ) : products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No products available</Text>
          <Text style={styles.emptySubText}>Check back later!</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.productList}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Order Modal */}
      <Modal
        visible={orderModal}
        transparent
        animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Order {selectedProduct?.name}
            </Text>
            <Text style={styles.modalPrice}>
              ₱{selectedProduct?.price} per {selectedProduct?.unit}
            </Text>
            <Text style={styles.modalStock}>
              Available: {selectedProduct?.quantity} {selectedProduct?.unit}
            </Text>

            <Text style={styles.modalLabel}>Quantity:</Text>
            <TextInput
              style={styles.quantityInput}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
              placeholder="Enter quantity"
            />

            <Text style={styles.modalTotal}>
              Total: ₱
              {selectedProduct
                ? (selectedProduct.price * (parseInt(quantity) || 0)).toFixed(2)
                : 0}
            </Text>

            {ordering ? (
              <ActivityIndicator size="large" color="#2E86AB" />
            ) : (
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setOrderModal(false);
                    setQuantity('1');
                  }}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={handleOrder}>
                  <Text style={styles.confirmButtonText}>
                    Confirm Order
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5'
  },
  header: {
    backgroundColor: '#2E86AB',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center'
  },
  backButton: {
    color: 'white',
    fontSize: 16,
    marginRight: 15
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold'
  },
  categoryContainer: {
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 10,
    maxHeight: 60
  },
  categoryButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#F0F0F0'
  },
  categoryActive: {
    backgroundColor: '#2E86AB'
  },
  categoryText: {
    fontSize: 13,
    color: '#666'
  },
  categoryTextActive: {
    color: 'white',
    fontWeight: 'bold'
  },
  loader: {
    marginTop: 50
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold'
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 5
  },
  productList: {
    padding: 15
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E86AB'
  },
  productDesc: {
    fontSize: 13,
    color: '#666',
    marginBottom: 10
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10
  },
  productStock: {
    fontSize: 13,
    color: '#999'
  },
  orderButton: {
    backgroundColor: '#2E86AB',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8
  },
  orderButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 13
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 25
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5
  },
  modalPrice: {
    fontSize: 16,
    color: '#2E86AB',
    fontWeight: 'bold',
    marginBottom: 5
  },
  modalStock: {
    fontSize: 14,
    color: '#999',
    marginBottom: 15
  },
  modalLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5
  },
  quantityInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 15
  },
  modalTotal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDD',
    alignItems: 'center',
    marginRight: 10
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold'
  },
  confirmButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#2E86AB',
    alignItems: 'center'
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: 'bold'
  }
});