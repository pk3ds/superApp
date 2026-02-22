import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppSelector } from '../../app/hooks';

const ROLE_MESSAGES: Record<string, string> = {
  superadmin: 'You have full system access. Manage all apps and users.',
  admin: 'You have administrative privileges. Manage apps and content.',
  user: 'You have standard access. Explore available mini apps.',
};

export default function DashboardScreen() {
  const user = useAppSelector((state) => state.auth.user);

  if (!user) return null;

  return (
    <View style={styles.container}>
      <View style={styles.welcomeCard}>
        <Text style={styles.greeting}>Welcome back,</Text>
        <Text style={styles.name}>{user.name}!</Text>
      </View>

      <View style={styles.roleCard}>
        <Text style={styles.roleLabel}>Your Role</Text>
        <Text style={styles.roleValue}>{user.role.toUpperCase()}</Text>
        <Text style={styles.roleMessage}>{ROLE_MESSAGES[user.role]}</Text>
      </View>

      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Mini Apps</Text>
        <View style={styles.statsRow}>
          <StatItem label="Profile" value="Active" />
          <StatItem label="Dashboard" value="Active" />
        </View>
      </View>
    </View>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  welcomeCard: {
    backgroundColor: '#4A90D9',
    borderRadius: 12,
    padding: 25,
    marginBottom: 15,
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  name: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
  roleCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  roleLabel: {
    fontSize: 13,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  roleValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
  },
  roleMessage: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    lineHeight: 20,
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A90D9',
  },
  statLabel: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
});
