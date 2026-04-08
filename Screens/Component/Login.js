import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, Image,
    SafeAreaView, ScrollView, StatusBar,
    ActivityIndicator, Keyboard
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { API, Colors, Fonts } from './Commoncomponent/Constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

const Login = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState(null);
    const [mobileerror, setMobileerror] = useState(null);
    const [passwordError, setPasswordError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleValidation = () => {
        const isNumber = /^[0-9]*$/.test(email);

        if (!email) {
            setMobileerror('Please enter email or mobile no');
        } else if (isNumber && email.length !== 10) {
            // ✅ Mobile validation
            setMobileerror('Please enter 10 digit mobile number');
        } else {
            setMobileerror('');
        }
        if (!password) {
            setPasswordError('Please enter your password');
        } else {
            setPasswordError('');
        }
    };

    const handleLogin = async () => {
        handleValidation();
        const isNumber = /^[0-9]*$/.test(email);

        // ❌ Stop API call if invalid mobile
        if (isNumber && email.length !== 10) return;
        if (email && password) {
            setLoading(true);
            try {
                const response = await fetch(API.login, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_name: email, user_password: password }),
                });
                const result = await response.json();
                if (result.code == 200) {
                    await AsyncStorage.setItem('id', result.payload.id.toString());

                    // ✅ Toast Show
                    Toast.show({
                        type: 'success',
                        text1: 'Login Successfully',
                        position: 'bottom',
                        bottomOffset: 60,
                        visibilityTime: 2000,
                    });

                    // ✅ Thoda delay de do (optional but better UX)
                    setTimeout(() => {
                        navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] });
                    }, 500);
                } else {
                    setError(result.message);
                }
            } catch (e) {
                setError('Something went wrong. Try again.');
            }
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.buttonbgcolor }}>
            <StatusBar backgroundColor={Colors.buttonbgcolor} barStyle="light-content" />

            {/* TOP SECTION */}
            <View style={{
                backgroundColor: Colors.buttonbgcolor,
                paddingTop: 40,
                paddingBottom: 45,
                alignItems: 'center',
            }}>
                <View style={{
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                    backgroundColor: '#fdf8f8',
                    borderWidth: 2,
                    borderColor: 'rgba(255,255,255,0.3)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 12,
                }}>
                    <Image
                        source={require('../assets/shivayoriginal.png')}
                        style={{
                            width: 65,
                            height: 65,
                            borderRadius: 50,
                            resizeMode: 'contain',
                        }}
                    />
                </View>
                <Text style={{
                    fontSize: 22,
                    fontFamily: 'Inter-Bold',
                    color: '#fff',
                    marginBottom: 4,
                }}>
                    Shivay Photo
                </Text>
            </View>

            {/* FORM CARD */}
            <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <View style={{
                    flex: 1,
                    backgroundColor: '#fff',
                    borderTopLeftRadius: 28,
                    borderTopRightRadius: 28,
                    marginTop: 0,
                    paddingHorizontal: 24,
                    paddingTop: 30,
                    paddingBottom: 30,
                }}>
                    <Text style={{
                        fontSize: 20,
                        fontFamily: 'Inter-Bold',
                        color: '#1a1a2e',
                        marginBottom: 4,
                    }}>
                        Welcome back
                    </Text>
                    <Text style={{
                        fontSize: 13,
                        fontFamily: Fonts.Regular,
                        color: '#94a3b8',
                        marginBottom: 28,
                    }}>
                        Sign in to your account
                    </Text>

                    {/* Email */}
                    <Text style={{
                        fontSize: 11,
                        fontFamily: Fonts.Semibold,
                        color: '#64748b',
                        letterSpacing: 0.5,
                        marginBottom: 8,
                    }}>
                        EMAIL / MOBILE NUMBER
                    </Text>
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: mobileerror ? '#fff5f5' : '#f8fafc',
                        borderRadius: 14,
                        paddingHorizontal: 14,
                        height: 50,
                        borderWidth: 1,
                        borderColor: mobileerror ? '#ef4444' : '#e2e8f0',
                        gap: 10,
                        marginBottom: mobileerror ? 6 : 16,
                    }}>
                        <Icon name="email-outline" size={18} color="#94a3b8" />
                        <TextInput
                            placeholder="Enter email or mobile number"
                            value={email}
                            onChangeText={(t) => { setEmail(t); if (t) setMobileerror(''); }}
                            style={{
                                flex: 1,
                                fontSize: 14,
                                fontFamily: Fonts.Regular,
                                color: '#1e293b',
                            }}
                            placeholderTextColor="#c0ccd8"
                            keyboardType="default"
                            // ✅ IMPORTANT LINE
                            maxLength={/^[0-9]*$/.test(email) ? 10 : 50}
                            autoCapitalize="none"
                        />
                    </View>
                    {mobileerror ? (
                        <Text style={{
                            fontSize: 12,
                            color: '#ef4444',
                            fontFamily: Fonts.Regular,
                            marginBottom: 12,
                            marginLeft: 4,
                        }}>
                            {mobileerror}
                        </Text>
                    ) : null}

                    {/* Password */}
                    <Text style={{
                        fontSize: 11,
                        fontFamily: Fonts.Semibold,
                        color: '#64748b',
                        letterSpacing: 0.5,
                        marginBottom: 8,
                    }}>
                        PASSWORD
                    </Text>
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: passwordError ? '#fff5f5' : '#f8fafc',
                        borderRadius: 14,
                        paddingHorizontal: 14,
                        height: 50,
                        borderWidth: 1,
                        borderColor: passwordError ? '#ef4444' : '#e2e8f0',
                        gap: 10,
                        marginBottom: passwordError ? 6 : 16,
                    }}>
                        <Icon name="lock-outline" size={18} color="#94a3b8" />
                        <TextInput
                            placeholder="Enter your password"
                            value={password}
                            onChangeText={(t) => { setPassword(t); if (t) setPasswordError(''); }}
                            secureTextEntry={!showPassword}
                            style={{
                                flex: 1,
                                fontSize: 14,
                                fontFamily: Fonts.Regular,
                                color: '#1e293b',
                            }}
                            placeholderTextColor="#c0ccd8"
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            <Icon
                                name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                                size={18}
                                color="#94a3b8"
                            />
                        </TouchableOpacity>
                    </View>
                    {passwordError ? (
                        <Text style={{
                            fontSize: 12,
                            color: '#ef4444',
                            fontFamily: Fonts.Regular,
                            marginBottom: 12,
                            marginLeft: 4,
                        }}>
                            {passwordError}
                        </Text>
                    ) : null}

                    <TouchableOpacity
                        style={{
                            backgroundColor: Colors.buttonbgcolor,
                            borderRadius: 14,
                            height: 52,
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginTop: 10,
                            elevation: 3,
                            shadowColor: Colors.buttonbgcolor,
                            shadowOpacity: 0.3,
                            shadowRadius: 8,
                            shadowOffset: { width: 0, height: 4 },
                            flexDirection: 'row', // ✅ important
                        }}
                        onPress={() => { handleLogin(); Keyboard.dismiss(); }}
                        activeOpacity={0.85}
                        disabled={loading} // ✅ prevent multiple clicks
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={{
                                color: Colors.btntext,
                                fontSize: 16,
                                fontFamily: 'Inter-Bold',
                            }}>
                                Login
                            </Text>
                        )}
                    </TouchableOpacity>
                    {error ? (
                        <Text style={{
                            fontSize: 12,
                            color: '#ef4444',
                            fontFamily: Fonts.Regular,
                            textAlign: 'center',
                            marginTop: 8,
                        }}>
                            {error}
                        </Text>
                    ) : null}

                    {/* Divider */}
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginVertical: 22,
                        gap: 10,
                    }}>
                        <View style={{ flex: 1, height: 0.5, backgroundColor: '#e2e8f0' }} />
                        <Text style={{
                            fontSize: 11,
                            color: '#94a3b8',
                            fontFamily: Fonts.Regular,
                        }}>
                            Powered by Shivay Photo
                        </Text>
                        <View style={{ flex: 1, height: 0.5, backgroundColor: '#e2e8f0' }} />
                    </View>

                    {/* Secure badge */}
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                    }}>
                        <Icon name="shield-check-outline" size={14} color="#cbd5e1" />
                        <Text style={{
                            fontSize: 11,
                            color: '#cbd5e1',
                            fontFamily: Fonts.Regular,
                        }}>
                            Secure login protected
                        </Text>
                    </View>

                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default Login;