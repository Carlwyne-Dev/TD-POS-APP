import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Store,
  Wallet,
  Rocket,
  ShoppingBasket,
  ShoppingBag,
  Info,
  Smartphone,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Settings,
} from 'lucide-react-native';
import { useFocusEffect } from 'expo-router';
import { getTransactions, getProducts, getUtangRecords, getExpenses } from '../../lib/storage';
import {
  calculateTodaysSales,
  calculateTodaysProfit,
  getPaymentBreakdown,
  calculateItemsSold,
} from '../../lib/calculations';
import { useSettings } from '../../context/SettingsContext';
import { Theme } from '../../constants/Theme';

const getLocalISOString = (dateString?: string) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  const localD = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return localD.toISOString();
};

const isCashPayment = (paymentType?: string | null) =>
  paymentType === 'cash' || paymentType === undefined || paymentType === null;

export default function DailyReportScreen() {
  const { businessSettings, setIsSettingsOpen } = useSettings();

  const [salesCount, setSalesCount] = useState(0);
  const [itemsSold, setItemsSold] = useState(0);
  const [todaysSales, setTodaysSales] = useState(0);
  const [todaysProfit, setTodaysProfit] = useState(0);
  const [paymentStats, setPaymentStats] = useState({ cash: 0, gcash: 0 });
  const [utangIssued, setUtangIssued] = useState(0);
  const [utangCollected, setUtangCollected] = useState(0);
  const [todaysExpenses, setTodaysExpenses] = useState(0);

  useFocusEffect(
    React.useCallback(() => {
      loadReport();
    }, [])
  );

  const loadReport = async () => {
    const [transactions, products, utang, expenses] = await Promise.all([
      getTransactions(),
      getProducts(),
      getUtangRecords(),
      getExpenses(),
    ]);

    const now = new Date();
    const todayStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .split('T')[0];

    const todaysTransactions = transactions.filter(t =>
      getLocalISOString(t.timestamp).startsWith(todayStr)
    );

    setSalesCount(todaysTransactions.length);
    setItemsSold(calculateItemsSold(todaysTransactions));
    setTodaysSales(calculateTodaysSales(todaysTransactions));
    setTodaysProfit(calculateTodaysProfit(todaysTransactions, products));
    setPaymentStats(getPaymentBreakdown(todaysTransactions));

    setUtangIssued(
      utang
        .filter(r => getLocalISOString(r.createdAt).startsWith(todayStr))
        .reduce((s, r) => s + r.amount, 0)
    );
    setUtangCollected(
      utang
        .filter(
          r =>
            r.isPaid &&
            getLocalISOString(r.paidAt).startsWith(todayStr) &&
            isCashPayment(r.paymentType)
        )
        .reduce((s, r) => s + r.amount, 0)
    );
    setTodaysExpenses(
      expenses
        .filter(
          e =>
            getLocalISOString(e.timestamp).startsWith(todayStr) &&
            isCashPayment(e.paymentType)
        )
        .reduce((s, e) => s + e.amount, 0)
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.boutiqueHeader}>
        <View>
          <Text style={styles.boutiqueTitle}>Daily Report</Text>
          <Text style={styles.boutiqueSubtitle}>End of Day Summary</Text>
        </View>
        <TouchableOpacity style={styles.settingsHeaderBtn} onPress={() => setIsSettingsOpen(true)}>
          <Settings size={22} color={Theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Store size={40} color={Theme.colors.primary} style={{ marginBottom: 12 }} />
            <Text style={styles.summaryTitle}>{businessSettings.ownerName || 'sPOSify'}</Text>
            <Text style={styles.summarySubtitle}>Daily Performance Report</Text>
            <Text style={styles.summaryDate}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>

          <View style={styles.summaryBody}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryRowLabelGroup}>
                <Wallet size={18} color={Theme.colors.onSurfaceVariant} />
                <Text style={styles.summaryItemLabel}>Gross Sales</Text>
              </View>
              <Text style={styles.summaryItemValue}>₱{todaysSales.toLocaleString()}</Text>
            </View>

            <View style={styles.summaryRow}>
              <View style={styles.summaryRowLabelGroup}>
                <Rocket size={18} color={Theme.colors.primary} />
                <Text style={[styles.summaryItemLabel, { color: Theme.colors.primary }]}>
                  Total Profit
                </Text>
              </View>
              <Text style={[styles.summaryItemValue, { color: Theme.colors.primary }]}>
                ₱{todaysProfit.toLocaleString()}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <View style={styles.summaryRowLabelGroup}>
                <ShoppingBasket size={18} color={Theme.colors.onSurfaceVariant} />
                <Text style={styles.summaryItemLabel}>Sales Count</Text>
              </View>
              <Text style={styles.summaryItemValue}>{salesCount} sales</Text>
            </View>

            <View style={styles.summaryRow}>
              <View style={styles.summaryRowLabelGroup}>
                <ShoppingBag size={18} color={Theme.colors.onSurfaceVariant} />
                <Text style={styles.summaryItemLabel}>Items Sold</Text>
              </View>
              <Text style={styles.summaryItemValue}>{itemsSold} items</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <View style={styles.summaryRowLabelGroup}>
                <Info size={18} color="#0a643b" />
                <Text style={styles.summaryItemLabel}>Cash Total</Text>
              </View>
              <Text style={styles.summaryItemValue}>₱{paymentStats.cash.toLocaleString()}</Text>
            </View>

            <View style={styles.summaryRow}>
              <View style={styles.summaryRowLabelGroup}>
                <Smartphone size={18} color="#2563eb" />
                <Text style={styles.summaryItemLabel}>GCash Total</Text>
              </View>
              <Text style={styles.summaryItemValue}>₱{paymentStats.gcash.toLocaleString()}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <View style={styles.summaryRowLabelGroup}>
                <AlertTriangle size={18} color={Theme.colors.tertiary} />
                <Text style={styles.summaryItemLabel}>Debt Issued (Utang)</Text>
              </View>
              <Text style={[styles.summaryItemValue, { color: Theme.colors.tertiary }]}>
                +₱{utangIssued.toLocaleString()}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <View style={styles.summaryRowLabelGroup}>
                <CheckCircle2 size={18} color="#0a643b" />
                <Text style={styles.summaryItemLabel}>Debt Collected</Text>
              </View>
              <Text style={[styles.summaryItemValue, { color: '#0a643b' }]}>
                -₱{utangCollected.toLocaleString()}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <View style={styles.summaryRowLabelGroup}>
                <TrendingDown size={18} color={Theme.colors.tertiary} />
                <Text style={styles.summaryItemLabel}>Daily Costs</Text>
              </View>
              <Text style={[styles.summaryItemValue, { color: Theme.colors.tertiary }]}>
                - ₱{todaysExpenses.toLocaleString()}
              </Text>
            </View>

            <View
              style={[
                styles.summaryRow,
                {
                  backgroundColor: Theme.colors.primaryContainer + '20',
                  borderRadius: 20,
                  paddingHorizontal: 16,
                  marginTop: 8,
                },
              ]}
            >
              <Text style={[styles.summaryItemLabel, { fontFamily: Theme.typography.headlineBlack }]}>
                Net Performance
              </Text>
              <Text style={[styles.summaryItemValue, { fontSize: 22, color: Theme.colors.primary }]}>
                ₱{(todaysProfit - todaysExpenses).toLocaleString()}
              </Text>
            </View>
          </View>
        </Animated.View>

        <Text style={styles.shareHint}>Take a screenshot to save this report</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  boutiqueHeader: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingsHeaderBtn: {
    padding: 8,
    backgroundColor: Theme.colors.surfaceContainerHigh,
    borderRadius: 16,
  },
  boutiqueTitle: {
    fontFamily: Theme.typography.headlineBlack,
    fontSize: 34,
    color: Theme.colors.onSurface,
    letterSpacing: -1.5,
  },
  boutiqueSubtitle: {
    fontFamily: Theme.typography.bodyBold,
    fontSize: 12,
    color: Theme.colors.primary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    opacity: 0.8,
  },
  content: {
    padding: 16,
    paddingBottom: 160,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 28,
    borderWidth: 1,
    borderColor: Theme.colors.outlineVariant,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
  },
  summaryHeader: {
    alignItems: 'center',
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.outlineVariant,
    paddingBottom: 24,
  },
  summaryTitle: {
    fontFamily: Theme.typography.headlineBlack,
    fontSize: 28,
    color: Theme.colors.onSurface,
    textAlign: 'center',
  },
  summarySubtitle: {
    fontFamily: Theme.typography.bodyBold,
    fontSize: 12,
    color: Theme.colors.primary,
    letterSpacing: 2,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  summaryDate: {
    fontFamily: Theme.typography.bodyMedium,
    color: Theme.colors.outline,
    marginTop: 8,
    fontSize: 14,
  },
  summaryBody: {
    gap: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  summaryRowLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryItemLabel: {
    fontFamily: Theme.typography.bodySemiBold,
    fontSize: 15,
    color: Theme.colors.onSurface,
  },
  summaryItemValue: {
    fontFamily: Theme.typography.headlineBlack,
    fontSize: 18,
    color: Theme.colors.onSurface,
  },
  divider: {
    height: 1,
    backgroundColor: Theme.colors.outlineVariant,
    marginVertical: 16,
    opacity: 0.5,
  },
  shareHint: {
    fontFamily: Theme.typography.bodyMedium,
    color: Theme.colors.outline,
    fontSize: 12,
    marginTop: 20,
    textAlign: 'center',
  },
});
