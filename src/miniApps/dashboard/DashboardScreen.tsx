import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAppSelector } from "../../app/hooks";

const ROLE_CONFIG: Record<
  string,
  { color: string; icon: keyof typeof Ionicons.glyphMap; message: string }
> = {
  superadmin: {
    color: "#E85A00",
    icon: "shield-checkmark",
    message: "Full system access — manage all apps and users.",
  },
  admin: {
    color: "#3333CC",
    icon: "settings",
    message: "Administrative privileges — manage apps and content.",
  },
  user: {
    color: "#27AE60",
    icon: "person-circle",
    message: "Standard access — explore available mini apps.",
  },
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardScreen() {
  const user = useAppSelector((state) => state.auth.user);
  const navigation = useNavigation<any>();

  const QUICK_ACTIONS: {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    onPress: () => void;
  }[] = [
    {
      label: "Profile",
      icon: "person-outline",
      color: "#3333CC",
      onPress: () => navigation.navigate("Profile"),
    },
    ...(user.role !== "user"
      ? [
          {
            label: "Maps",
            icon: "map-outline" as keyof typeof Ionicons.glyphMap,
            color: "#E85A00",
            onPress: () => navigation.navigate("Maps"),
          },
        ]
      : []),
    {
      label: "Shop",
      icon: "storefront-outline",
      color: "#27AE60",
      onPress: () => navigation.navigate("Shop"),
    },
    {
      label: "Help",
      icon: "help-circle-outline",
      color: "#8E44AD",
      onPress: () =>
        Alert.alert(
          "Help & Support",
          "SuperApp v1.0.0\n\nFor support, contact:\naiman.azhari@tm.com.my",
          [{ text: "OK" }],
        ),
    },
  ];

  if (!user) return null;

  const roleConfig = ROLE_CONFIG[user.role];
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Welcome Card */}
      <View style={styles.welcomeCard}>
        <View style={styles.welcomeRow}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.name}>{user.name}!</Text>
          </View>
          <View style={styles.avatarBadge}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </View>
        <View style={styles.welcomeDivider} />
        <Text style={styles.welcomeSub}>Here's your overview for today.</Text>
      </View>

      {/* Role Card */}
      <View style={styles.roleCard}>
        <View style={styles.roleHeader}>
          <View
            style={[
              styles.roleIconWrap,
              { backgroundColor: roleConfig.color + "18" },
            ]}
          >
            <Ionicons
              name={roleConfig.icon}
              size={22}
              color={roleConfig.color}
            />
          </View>
          <View style={styles.roleTextWrap}>
            <Text style={styles.roleLabel}>Your Role</Text>
            <Text style={[styles.roleValue, { color: roleConfig.color }]}>
              {user.role.toUpperCase()}
            </Text>
          </View>
          <View
            style={[
              styles.rolePill,
              { backgroundColor: roleConfig.color + "18" },
            ]}
          >
            <Text style={[styles.rolePillText, { color: roleConfig.color }]}>
              Active
            </Text>
          </View>
        </View>
        <Text style={styles.roleMessage}>{roleConfig.message}</Text>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={[styles.statBox, { borderTopColor: "#3333CC" }]}>
          <Ionicons name="apps-outline" size={22} color="#3333CC" />
          <Text style={[styles.statNum, { color: "#3333CC" }]}>{user.role !== "user" ? 4 : 3}</Text>
          <Text style={styles.statLabel}>Active Apps</Text>
        </View>
        <View style={[styles.statBox, { borderTopColor: "#E85A00" }]}>
          <Ionicons name="checkmark-circle-outline" size={22} color="#E85A00" />
          <Text style={[styles.statNum, { color: "#E85A00" }]}>1</Text>
          <Text style={styles.statLabel}>Your Role</Text>
        </View>
        <View style={[styles.statBox, { borderTopColor: "#27AE60" }]}>
          <Ionicons name="pulse-outline" size={22} color="#27AE60" />
          <Text style={[styles.statNum, { color: "#27AE60" }]}>100%</Text>
          <Text style={styles.statLabel}>Uptime</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        {QUICK_ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.label}
            style={styles.actionCard}
            activeOpacity={0.7}
            onPress={action.onPress}
          >
            <View
              style={[
                styles.actionIconWrap,
                { backgroundColor: action.color + "18" },
              ]}
            >
              <Ionicons name={action.icon} size={26} color={action.color} />
            </View>
            <Text style={styles.actionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  welcomeCard: {
    backgroundColor: "#3333CC",
    borderRadius: 16,
    padding: 22,
    marginBottom: 16,
  },
  welcomeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  greeting: {
    fontSize: 15,
    color: "rgba(255,255,255,0.75)",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 2,
  },
  avatarBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  welcomeDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginVertical: 14,
  },
  welcomeSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.65)",
  },
  roleCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  roleHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  roleIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  roleTextWrap: {
    marginLeft: 12,
    flex: 1,
  },
  roleLabel: {
    fontSize: 12,
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  roleValue: {
    fontSize: 17,
    fontWeight: "bold",
    marginTop: 1,
  },
  rolePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  rolePillText: {
    fontSize: 12,
    fontWeight: "600",
  },
  roleMessage: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    borderTopWidth: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  statNum: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 6,
  },
  statLabel: {
    fontSize: 11,
    color: "#888",
    marginTop: 3,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  actionCard: {
    width: "47%",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 18,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
});
