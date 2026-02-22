import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { useAppDispatch } from "../app/hooks";
import { login } from "../features/auth/authSlice";
import { UserProfile } from "../features/auth/types";

const MOCK_USERS: Record<string, { password: string; profile: UserProfile }> = {
  "superadmin@a.com": {
    password: "password",
    profile: {
      id: "1",
      name: "Super Admin",
      email: "superadmin@a.com",
      role: "superadmin",
    },
  },
  "admin@a.com": {
    password: "password",
    profile: {
      id: "2",
      name: "Admin User",
      email: "admin@a.com",
      role: "admin",
    },
  },
  "user@a.com": {
    password: "password",
    profile: {
      id: "3",
      name: "Regular User",
      email: "user@a.com",
      role: "user",
    },
  },
};

export default function LoginScreen() {
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    const trimmedEmail = email.trim().toLowerCase();
    const mockUser = MOCK_USERS[trimmedEmail];

    if (mockUser && mockUser.password === password) {
      dispatch(login(mockUser.profile));
    } else {
      Alert.alert("Login Failed", "Invalid email or password.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.inner}>
        <Image
          source={require("../../assets/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>

        <View style={styles.hint}>
          <Text style={styles.hintTitle}>Demo Accounts:</Text>
          <Text style={styles.hintText}>superadmin@a.com</Text>
          <Text style={styles.hintText}>admin@a.com</Text>
          <Text style={styles.hintText}>user@a.com</Text>
          <Text style={styles.hintText}>Password: password</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  inner: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  logo: {
    width: 150,
    height: 150,
    alignSelf: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#666",
    marginBottom: 40,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  button: {
    backgroundColor: "#4A90D9",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  hint: {
    marginTop: 40,
    padding: 15,
    backgroundColor: "#e8f4fd",
    borderRadius: 8,
  },
  hintTitle: {
    fontWeight: "600",
    marginBottom: 5,
    color: "#333",
  },
  hintText: {
    color: "#555",
    fontSize: 13,
  },
});
