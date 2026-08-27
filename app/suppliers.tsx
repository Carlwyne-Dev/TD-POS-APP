import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  Plus,
  Building2,
  Phone,
  Users,
  MapPin,
  FileText,
  Edit2,
  Trash2,
  X,
  Check,
  Truck,
  PackageOpen,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn, Layout } from 'react-native-reanimated';
import { Theme } from '../constants/Theme';
import { Supplier, Product } from '../lib/types';
import { getSuppliers, addSupplier, updateSupplier, deleteSupplier, getProducts } from '../lib/storage';

const { width } = Dimensions.get('window');

export default function SuppliersScreen() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState<Partial<Supplier>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [viewProductsModal, setViewProductsModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const loadSuppliers = useCallback(async () => {
    const data = await getSuppliers();
    setSuppliers(data);
    const prods = await getProducts();
    setProducts(prods);
  }, []);

  useEffect(() => { loadSuppliers(); }, [loadSuppliers]);

  const openNew = () => { setCurrentSupplier({}); setErrors({}); setIsEditing(true); };
  const openEdit = (sup: Supplier) => { setCurrentSupplier({ ...sup }); setErrors({}); setIsEditing(true); };
  const cancelEdit = () => { setIsEditing(false); setCurrentSupplier({}); setErrors({}); };

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};
    if (!currentSupplier.name?.trim()) newErrors.name = 'Supplier name is required';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    if (currentSupplier.id) {
      await updateSupplier(currentSupplier.id, currentSupplier);
    } else {
      await addSupplier(currentSupplier as Omit<Supplier, 'id' | 'createdAt'>);
    }
    cancelEdit();
    loadSuppliers();
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete Supplier', `Remove "${name}" from your directory?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteSupplier(id); loadSuppliers(); } },
    ]);
  };

  // ─── FORM VIEW ───────────────────────────────────────────────────────────
  if (isEditing) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.pageHeader}>
            <TouchableOpacity style={styles.headerIconBtn} onPress={cancelEdit}>
              <X size={20} color={Theme.colors.onSurface} />
            </TouchableOpacity>
            <View>
              <Text style={styles.pageTitle}>{currentSupplier.id ? 'Edit Supplier' : 'New Supplier'}</Text>
              <Text style={styles.pageSubtitle}>SUPPLIER DIRECTORY</Text>
            </View>
            <TouchableOpacity style={[styles.headerIconBtn, { backgroundColor: Theme.colors.primary }]} onPress={handleSave}>
              <Check size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.formContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={styles.inputLabel}>COMPANY / SUPPLIER NAME *</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              placeholder="e.g. Coca-Cola Distributors"
              placeholderTextColor={Theme.colors.outlineVariant}
              value={currentSupplier.name || ''}
              onChangeText={(t) => setCurrentSupplier({ ...currentSupplier, name: t })}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

            <Text style={styles.inputLabel}>CONTACT PERSON</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Kuya Boy"
              placeholderTextColor={Theme.colors.outlineVariant}
              value={currentSupplier.contactPerson || ''}
              onChangeText={(t) => setCurrentSupplier({ ...currentSupplier, contactPerson: t })}
            />

            <Text style={styles.inputLabel}>PHONE NUMBER</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 09123456789"
              placeholderTextColor={Theme.colors.outlineVariant}
              keyboardType="phone-pad"
              value={currentSupplier.phone || ''}
              onChangeText={(t) => setCurrentSupplier({ ...currentSupplier, phone: t })}
            />

            <Text style={styles.inputLabel}>ADDRESS</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder="e.g. Main Street, Brgy 1"
              placeholderTextColor={Theme.colors.outlineVariant}
              multiline
              textAlignVertical="top"
              value={currentSupplier.address || ''}
              onChangeText={(t) => setCurrentSupplier({ ...currentSupplier, address: t })}
            />

            <Text style={styles.inputLabel}>NOTES</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder="e.g. Delivers every Tuesday, minimum order P1,000"
              placeholderTextColor={Theme.colors.outlineVariant}
              multiline
              textAlignVertical="top"
              value={currentSupplier.notes || ''}
              onChangeText={(t) => setCurrentSupplier({ ...currentSupplier, notes: t })}
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
              <Text style={styles.saveBtnText}>{currentSupplier.id ? 'Save Changes' : 'Add Supplier'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ─── LIST VIEW ───────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.pageHeader}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={() => router.back()}>
          <ChevronLeft size={22} color={Theme.colors.onSurface} />
        </TouchableOpacity>
        <View>
          <Text style={styles.pageTitle}>Suppliers</Text>
          <Text style={styles.pageSubtitle}>SUPPLIER DIRECTORY</Text>
        </View>
        <TouchableOpacity style={[styles.headerIconBtn, { backgroundColor: Theme.colors.primary }]} onPress={openNew}>
          <Plus size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroInfo}>
            <Text style={styles.heroLabel}>TOTAL SUPPLIERS</Text>
            <Text style={styles.heroValue}>{suppliers.length}</Text>
          </View>
          <View style={styles.heroPills}>
            <View style={styles.heroPill}>
              <Truck size={13} color="#FFF" />
              <Text style={styles.heroPillText}>
                {suppliers.filter(s => s.phone).length} with contact
              </Text>
            </View>
            <View style={styles.heroPill}>
              <MapPin size={13} color="#FFF" />
              <Text style={styles.heroPillText}>
                {suppliers.filter(s => s.address).length} with address
              </Text>
            </View>
          </View>
        </View>

        {/* Empty State */}
        {suppliers.length === 0 && (
          <Animated.View entering={FadeIn} style={styles.emptyState}>
            <View style={styles.emptyIconBox}>
              <Building2 size={40} color={Theme.colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No Suppliers Yet</Text>
            <Text style={styles.emptyText}>
              Track where your products come from. Add your first supplier below.
            </Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={openNew} activeOpacity={0.85}>
              <Plus size={18} color="#FFF" />
              <Text style={styles.emptyBtnText}>Add First Supplier</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Supplier Cards */}
        {suppliers.map((sup, i) => (
          <Animated.View
            key={sup.id}
            entering={FadeInDown.delay(i * 60).springify()}
            layout={Layout.springify()}
            style={styles.card}
          >
            {/* Card Top */}
            <View style={styles.cardTop}>
              <View style={styles.cardAvatar}>
                <Text style={styles.cardAvatarText}>{sup.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardName} numberOfLines={1}>{sup.name}</Text>
                {sup.contactPerson && (
                  <View style={styles.cardRow}>
                    <Users size={12} color={Theme.colors.outline} />
                    <Text style={styles.cardRowText}>{sup.contactPerson}</Text>
                  </View>
                )}
              </View>
              <View style={styles.cardBtns}>
                <TouchableOpacity style={styles.cardIconBtn} onPress={() => openEdit(sup)}>
                  <Edit2 size={15} color={Theme.colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.cardIconBtn, styles.cardDeleteBtn]} onPress={() => handleDelete(sup.id, sup.name)}>
                  <Trash2 size={15} color={Theme.colors.error} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Card Details */}
            {(sup.phone || sup.address || sup.notes) && (
              <View style={styles.cardBottom}>
                {sup.phone && (
                  <View style={styles.cardRow}>
                    <Phone size={12} color={Theme.colors.primary} />
                    <Text style={[styles.cardRowText, { color: Theme.colors.primary, fontFamily: Theme.typography.bodyBold }]}>{sup.phone}</Text>
                  </View>
                )}
                {sup.address && (
                  <View style={styles.cardRow}>
                    <MapPin size={12} color={Theme.colors.outline} />
                    <Text style={styles.cardRowText}>{sup.address}</Text>
                  </View>
                )}
                {sup.notes && (
                  <View style={[styles.cardRow, { marginTop: 4, backgroundColor: Theme.colors.surfaceContainerLow, padding: 8, borderRadius: 8 }]}>
                    <FileText size={12} color={Theme.colors.outline} />
                    <Text style={[styles.cardRowText, { fontStyle: 'italic', color: Theme.colors.outline }]}>{sup.notes}</Text>
                  </View>
                )}
              </View>
            )}
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Theme.colors.surfaceContainerHigh, padding: 12, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 }}
              onPress={() => { setSelectedSupplier(sup); setViewProductsModal(true); }}
            >
              <PackageOpen size={15} color={Theme.colors.primary} />
              <Text style={{ fontFamily: Theme.typography.bodyBold, color: Theme.colors.primary, fontSize: 13 }}>
                {products.filter(p => p.supplierId === sup.id).length} Products
              </Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>

      {/* FAB */}
      {suppliers.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={openNew} activeOpacity={0.85}>
          <Plus size={28} color="#FFF" strokeWidth={2.5} />
        </TouchableOpacity>
      )}
      {/* View Products Bottom Sheet Modal */}
      <Modal visible={viewProductsModal} transparent animationType="slide" onRequestClose={() => setViewProductsModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={() => setViewProductsModal(false)} />
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedSupplier?.name}'s Products</Text>
              <TouchableOpacity onPress={() => setViewProductsModal(false)}>
                <X size={24} color={Theme.colors.onSurface} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {products.filter(p => p.supplierId === selectedSupplier?.id).length === 0 ? (
                <Text style={{ textAlign: 'center', marginTop: 40, fontFamily: Theme.typography.bodyMedium, color: Theme.colors.onSurfaceVariant }}>No products linked to this supplier yet.</Text>
              ) : (
                products.filter(p => p.supplierId === selectedSupplier?.id).map(prod => (
                  <TouchableOpacity
                    key={prod.id}
                    style={{ flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: Theme.colors.surfaceContainerLow, borderRadius: 16, marginBottom: 8 }}
                    onPress={() => { setViewProductsModal(false); router.push({ pathname: '/product/[id]', params: { id: prod.id } }); }}
                  >
                    <View style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: Theme.colors.primaryContainer, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <Text style={{ fontFamily: Theme.typography.headlineBlack, color: Theme.colors.primary }}>{prod.name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: Theme.typography.bodyBold, fontSize: 15, color: Theme.colors.onSurface }}>{prod.name}</Text>
                      <Text style={{ fontFamily: Theme.typography.bodyMedium, color: Theme.colors.primary }}>₱{prod.price}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontFamily: Theme.typography.bodyMedium, fontSize: 12, color: Theme.colors.onSurfaceVariant }}>Stock</Text>
                      <Text style={{ fontFamily: Theme.typography.headlineBlack, color: prod.stock <= prod.lowStockThreshold ? Theme.colors.tertiary : Theme.colors.onSurface }}>{prod.stock}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },

  // ── Header ──────────────────────────────────────────────────────────────
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerIconBtn: {
    padding: 8,
    backgroundColor: Theme.colors.surfaceContainerHigh,
    borderRadius: 12,
  },
  pageTitle: {
    fontFamily: Theme.typography.headlineBlack,
    fontSize: 26,
    color: Theme.colors.onSurface,
    letterSpacing: -1,
    textAlign: 'center',
  },
  pageSubtitle: {
    fontFamily: Theme.typography.bodyBold,
    fontSize: 10,
    color: Theme.colors.primary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    opacity: 0.8,
    textAlign: 'center',
  },

  // ── Scroll container ────────────────────────────────────────────────────
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },

  // ── Hero Card (matches mainStatCard) ────────────────────────────────────
  heroCard: {
    backgroundColor: Theme.colors.primary,
    borderRadius: 24,
    padding: 24,
    minHeight: 140,
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  heroInfo: {
    marginBottom: 16,
  },
  heroLabel: {
    fontFamily: Theme.typography.bodyBold,
    fontSize: 12,
    color: '#FFF',
    opacity: 0.7,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  heroValue: {
    fontFamily: Theme.typography.headlineBlack,
    fontSize: 52,
    color: '#FFF',
    letterSpacing: -2,
    lineHeight: 54,
  },
  heroPills: {
    flexDirection: 'row',
    gap: 10,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 6,
  },
  heroPillText: {
    fontFamily: Theme.typography.bodyBold,
    fontSize: 12,
    color: '#FFF',
  },

  // ── Empty State ─────────────────────────────────────────────────────────
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Theme.colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontFamily: Theme.typography.headlineBlack,
    fontSize: 20,
    color: Theme.colors.onSurface,
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: Theme.typography.bodyMedium,
    fontSize: 14,
    color: Theme.colors.outline,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 100,
    elevation: 4,
    shadowColor: Theme.colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  emptyBtnText: {
    fontFamily: Theme.typography.headlineBlack,
    color: '#FFF',
    fontSize: 15,
  },

  // ── Supplier Cards ───────────────────────────────────────────────────────
  card: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: Theme.colors.outlineVariant + '60',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  cardAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Theme.colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardAvatarText: {
    fontFamily: Theme.typography.headlineBlack,
    fontSize: 24,
    color: Theme.colors.primary,
  },
  cardName: {
    fontFamily: Theme.typography.headlineBlack,
    fontSize: 17,
    color: Theme.colors.onSurface,
    letterSpacing: -0.3,
    marginBottom: 3,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    marginBottom: 2,
  },
  cardRowText: {
    fontFamily: Theme.typography.bodyMedium,
    fontSize: 13,
    color: Theme.colors.onSurfaceVariant,
    flex: 1,
  },
  cardBtns: {
    flexDirection: 'row',
    gap: 8,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  cardIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Theme.colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.outlineVariant,
  },
  cardDeleteBtn: {
    borderColor: '#fecdd3',
    backgroundColor: '#fff1f2',
  },
  cardBottom: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.outlineVariant + '50',
    paddingTop: 12,
    gap: 6,
  },

  // ── FAB ─────────────────────────────────────────────────────────────────
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: Theme.colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },

  // ── Form ─────────────────────────────────────────────────────────────────
  formContent: {
    paddingHorizontal: 20,
    paddingBottom: 60,
  },
  inputLabel: {
    fontFamily: Theme.typography.bodyBold,
    fontSize: 11,
    color: Theme.colors.primary,
    letterSpacing: 0.8,
    marginTop: 20,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderRadius: 16,
    padding: 16,
    fontFamily: Theme.typography.bodySemiBold,
    fontSize: 15,
    color: Theme.colors.onSurface,
    borderWidth: 1.5,
    borderColor: Theme.colors.outlineVariant,
  },
  inputError: {
    borderColor: Theme.colors.error,
  },
  multiline: {
    height: 90,
    textAlignVertical: 'top',
  },
  errorText: {
    fontFamily: Theme.typography.bodyMedium,
    fontSize: 12,
    color: Theme.colors.error,
    marginTop: 4,
    marginLeft: 4,
  },
  saveBtn: {
    backgroundColor: Theme.colors.primary,
    padding: 18,
    borderRadius: 100,
    alignItems: 'center',
    marginTop: 36,
    elevation: 4,
    shadowColor: Theme.colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  saveBtnText: {
    fontFamily: Theme.typography.headlineBlack,
    color: '#FFF',
    fontSize: 16,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: Theme.colors.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '80%', paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontFamily: Theme.typography.headlineBlack, fontSize: 20, color: Theme.colors.onSurface },
});
