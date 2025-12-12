import { useUser } from "@clerk/clerk-expo";
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SignOutButton } from "../../components/SignOutButton";
import { Transaction, useTranscations } from "@/hooks/useTransactions";
import { useEffect, useState } from "react";
import PageLoader from "@/components/PageLoader";
import { styles } from "@/styles/home.styles";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/colors";
import { CATEGORIES, formatDate } from "@/lib/utils";
import { stylesCreate } from "@/styles/create.styles";

export default function Page() {
  const { user } = useUser();

  const {
    transactions,
    summary,
    isLoading,
    fetchTransactions,
    addTransaction,
    deleteTransaction,
  } = useTranscations(user?.id ?? "");

  const [isAddTransactionModalVisible, setIsAddTransactionModalVisible] =
    useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  if (isLoading && !isRefreshing) return <PageLoader />;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image
              source={require("@/assets/images/logo.png")}
              style={styles.headerLogo}
            />
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.usernameText}>
                {user?.emailAddresses[0].emailAddress.split("@")[0]}
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setIsAddTransactionModalVisible(true)}
            >
              <Ionicons name="add" size={24} color={COLORS.white} />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
            <SignOutButton />
          </View>
        </View>
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceTitle}>Total Balance</Text>
          <Text style={styles.balanceAmount}>
            {summary.balance.toLocaleString("en-IN", {
              style: "currency",
              currency: "INR",
            })}
          </Text>
          <View style={styles.balanceStats}>
            <View style={styles.balanceStatItem}>
              <Text style={styles.balanceStatLabel}>Income</Text>
              <Text
                style={[styles.balanceStatAmount, { color: COLORS.income }]}
              >
                {summary.totalIncome.toLocaleString("en-IN", {
                  style: "currency",
                  currency: "INR",
                })}
              </Text>
            </View>
            <View style={styles.balanceStatItem}>
              <Text style={styles.balanceStatLabel}>Expense</Text>
              <Text
                style={[styles.balanceStatAmount, { color: COLORS.expense }]}
              >
                {summary.totalExpense.toLocaleString("en-IN", {
                  style: "currency",
                  currency: "INR",
                })}
              </Text>
            </View>
          </View>
        </View>
        {/* Recent Transactions */}
        <View style={styles.transactionsHeaderContainer}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {transactions.length === 0 ? (
            <EmptyState />
          ) : (
            <FlatList
              data={transactions}
              renderItem={({ item }) => (
                <TransactionItem
                  transaction={item}
                  onDelete={deleteTransaction}
                />
              )}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              style={styles.transactionsList}
              contentContainerStyle={styles.transactionsListContent}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={async () => {
                    setIsRefreshing(true);
                    await fetchTransactions();
                    setIsRefreshing(false);
                  }}
                />
              }
            />
          )}
        </View>
      </View>
      <AddTransactionModal
        visible={isAddTransactionModalVisible}
        onClose={() => setIsAddTransactionModalVisible(false)}
        addTransaction={addTransaction}
      />
    </View>
  );
}

const TransactionItem = ({
  transaction,
  onDelete,
}: {
  transaction: Transaction;
  onDelete: (id: string) => void;
}) => {
  const isIncome = transaction.amount > 0;
  const iconName = CATEGORIES.find(
    (category) => category.id === transaction.category
  )?.icon;

  return (
    <View style={styles.transactionCard} key={transaction.id}>
      <TouchableOpacity style={styles.transactionContent}>
        <View style={styles.categoryIconContainer}>
          <Ionicons
            // @ts-ignore
            name={iconName}
            size={22}
            color={isIncome ? COLORS.income : COLORS.expense}
          />
        </View>
        <View style={styles.transactionLeft}>
          <Text style={styles.transactionTitle}>{transaction.title}</Text>
          <Text style={styles.transactionCategory}>{transaction.category}</Text>
        </View>
        <View style={styles.transactionRight}>
          <Text
            style={[
              styles.transactionAmount,
              { color: isIncome ? COLORS.income : COLORS.expense },
            ]}
          >
            {isIncome ? "+" : "-"}₹{Math.abs(transaction.amount).toFixed(2)}
          </Text>
          <Text style={styles.transactionDate}>
            {transaction.date ? formatDate(transaction.date) : "N/A"}
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => onDelete(transaction.id)}
      >
        <Ionicons name="trash-outline" size={20} color={COLORS.expense} />
      </TouchableOpacity>
    </View>
  );
};

const EmptyState = () => (
  <View style={styles.emptyState}>
    <Ionicons name="sad-outline" size={50} color={COLORS.textLight} />
    <Text style={styles.emptyStateText}>No transactions found</Text>
    <Text style={styles.emptyStateText}>Start by adding your first transaction!</Text>
  </View>
);

const AddTransactionModal = ({
  visible,
  onClose,
  addTransaction,
}: {
  visible: boolean;
  onClose: () => void;
  addTransaction: (
    transaction: Omit<Transaction, "id" | "createdAt" | "updatedAt" | "userId">
  ) => void;
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState<Date | null>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [description, setDescription] = useState("");
  const [isExpense, setIsExpense] = useState(true);

  const handleAddTransaction = () => {
    if (!selectedCategory || !title || amount <= 0 || !date) {
      Alert.alert("Please fill in all fields");
      return;
    }
    setIsLoading(true);
    try {
      // Convert amount to negative for expenses, positive for income
      const finalAmount = isExpense ? -Math.abs(amount) : Math.abs(amount);
      
      addTransaction({
        amount: finalAmount,
        title,
        description,
        date: date ?? new Date(),
        category: selectedCategory,
      });
      onClose();
    } catch (error) {
      Alert.alert(
        "Error adding transaction:",
        error instanceof Error ? error.message : "Unknown error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedCategory("");
    setTitle("");
    setAmount(0);
    setDate(null);
    setDescription("");
    setIsExpense(true);
    onClose();
  };

  if (isLoading) return <PageLoader />;

  return (
    <Modal visible={visible} animationType="fade">
      <KeyboardAvoidingView
        style={stylesCreate.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* HEADER */}
        <View style={stylesCreate.header}>
          <TouchableOpacity
            style={stylesCreate.backButton}
            onPress={handleClose}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={stylesCreate.headerTitle}>New Transaction</Text>
          <TouchableOpacity
            style={[
              stylesCreate.saveButtonContainer,
              isLoading && stylesCreate.saveButtonDisabled,
            ]}
            onPress={handleAddTransaction}
            disabled={isLoading}
          >
            <Text style={stylesCreate.saveButton}>
              {isLoading ? "Saving..." : "Save"}
            </Text>
            {!isLoading && (
              <Ionicons name="checkmark" size={18} color={COLORS.primary} />
            )}
          </TouchableOpacity>
        </View>
        <View style={stylesCreate.card}>
          <View style={stylesCreate.typeSelector}>
            {/* EXPENSE SELECTOR */}
            <TouchableOpacity
              style={[
                stylesCreate.typeButton,
                isExpense && stylesCreate.typeButtonActive,
              ]}
              onPress={() => setIsExpense(true)}
            >
              <Ionicons
                name="arrow-down-circle"
                size={22}
                color={isExpense ? COLORS.white : COLORS.expense}
                style={stylesCreate.typeIcon}
              />
              <Text
                style={[
                  stylesCreate.typeButtonText,
                  isExpense && stylesCreate.typeButtonTextActive,
                ]}
              >
                Expense
              </Text>
            </TouchableOpacity>

            {/* INCOME SELECTOR */}
            <TouchableOpacity
              style={[
                stylesCreate.typeButton,
                !isExpense && stylesCreate.typeButtonActive,
              ]}
              onPress={() => setIsExpense(false)}
            >
              <Ionicons
                name="arrow-up-circle"
                size={22}
                color={!isExpense ? COLORS.white : COLORS.income}
                style={stylesCreate.typeIcon}
              />
              <Text
                style={[
                  stylesCreate.typeButtonText,
                  !isExpense && stylesCreate.typeButtonTextActive,
                ]}
              >
                Income
              </Text>
            </TouchableOpacity>
          </View>

          {/* AMOUNT */}
          <View style={stylesCreate.amountContainer}>
            <Text style={stylesCreate.currencySymbol}>₹</Text>
            <TextInput
              style={stylesCreate.amountInput}
              placeholder="0.00"
              placeholderTextColor={COLORS.textLight}
              value={Math.abs(amount).toString()}
              onChangeText={(text) => setAmount(Number(text) || 0)}
              keyboardType="numeric"
            />
            <Text style={[stylesCreate.amountType, { color: isExpense ? COLORS.expense : COLORS.income }]}>
              {isExpense ? "Expense" : "Income"}
            </Text>
          </View>
          {/* TITLE */}
          <Text style={stylesCreate.sectionTitle}>Title</Text>
          <View style={stylesCreate.inputContainer}>
            <TextInput
              style={stylesCreate.input}
              placeholder="Enter title"
              value={title}
              onChangeText={setTitle}
            />
          </View>
          {/* DESCRIPTION */}
          <Text style={stylesCreate.sectionTitle}>Description</Text>
          <View style={stylesCreate.inputContainer}>
            <TextInput
              style={stylesCreate.input}
              placeholder="Enter description"
              value={description}
              onChangeText={setDescription}
            />
          </View>
          {/* CATEGORY */}
          <Text style={stylesCreate.sectionTitle}>Category</Text>
          <View style={stylesCreate.categoryGrid}>
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  stylesCreate.categoryButton,
                  selectedCategory === category.id && stylesCreate.categoryButtonActive,
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Ionicons
                  // @ts-ignore
                  name={category.icon}
                  size={16}
                  color={selectedCategory === category.id ? COLORS.white : COLORS.text}
                  style={stylesCreate.categoryIcon}
                />
                <Text
                  style={[
                    stylesCreate.categoryButtonText,
                    selectedCategory === category.id && stylesCreate.categoryButtonTextActive,
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {/* DATE */}
          <Text style={stylesCreate.sectionTitle}>Date</Text>
          <View style={stylesCreate.inputContainer}>
            <TouchableOpacity 
              style={stylesCreate.input} 
              onPress={() => {
                // For now, set to current date. In a real app, you'd use a date picker
                setDate(new Date());
              }}
            >
              <Text style={stylesCreate.input}>
                {date ? formatDate(date) : "Select Date"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
