import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';
import { ProgressBar } from '../../components/auth/ProgressBar';
import { PrimaryButton } from '../../components/common/PrimaryButton';

export default function OtpVerificationScreen() {
  const { phone } = useLocalSearchParams<{ phone?: string }>();
  const displayPhone = phone || '98765 43210';
  const formattedPhone = displayPhone.startsWith('+91')
    ? displayPhone
    : `+91 ${displayPhone}`;

  // Default prefilled demo code to match mockup "4 2 7 1 9 0"
  const [code, setCode] = useState(['4', '2', '7', '1', '9', '0']);
  const [countdown, setCountdown] = useState(28);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleDigitChange = (value: string, index: number) => {
    const cleaned = value.replace(/\D/g, '');
    const newCode = [...code];

    if (cleaned.length > 1) {
      // Pasted string
      const digits = cleaned.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newCode[i] = digits[i] || '';
      }
      setCode(newCode);
      const nextIndex = Math.min(digits.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    newCode[index] = cleaned;
    setCode(newCode);

    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const formattedTimer = `00:${countdown < 10 ? `0${countdown}` : countdown}`;

  const handleResend = () => {
    if (countdown === 0) {
      setCountdown(28);
    }
  };

  const handleContinue = () => {
    alert('Code verified successfully!');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 24,
            paddingTop: 8,
            paddingBottom: 24,
          }}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Top Navigation Bar */}
          <View className="flex-row items-center justify-between h-[44px]">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 justify-center items-start"
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="chevron-back" size={26} color="#1F1F1F" />
            </TouchableOpacity>

            <View className="items-center justify-center">
              <ProgressBar currentStep={2} totalSteps={3} />
            </View>

            <View className="w-10" />
          </View>

          {/* Top Circular Badge Icon */}
          <View className="items-center justify-center mt-[18px] mb-4">
            <Image
              source={require('../../../assets/images/auth-otp-badge.png')}
              className="w-[96px] h-[96px]"
              resizeMode="contain"
            />
          </View>

          {/* Title & Phone Subtitle */}
          <View className="items-center mb-6">
            <Text className="text-[32px] font-extrabold text-[#0F172A] tracking-tight mb-2 text-center">
              Check your phone.
            </Text>
            <Text className="text-[16px] text-[#737373] text-center leading-[22px]">
              We sent a verification code to
            </Text>
            <Text className="text-[16px] font-bold text-[#0F172A] text-center mt-0.5">
              {formattedPhone}.
            </Text>
          </View>

          {/* 6 OTP Input Boxes */}
          <View className="flex-row justify-between mb-6 gap-2">
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                className="flex-1 h-[62px] border-[1.2px] border-brand-border rounded-xl bg-white text-[25px] font-bold text-[#1F1F1F] text-center"
                value={digit}
                onChangeText={(val) => handleDigitChange(val, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                textAlign="center"
              />
            ))}
          </View>

          {/* Continue Primary Button */}
          <PrimaryButton
            title="Continue"
            onPress={handleContinue}
            className="mb-4"
          />

          {/* Resend Countdown */}
          <View className="flex-row justify-center items-center mb-4">
            <Text className="text-[14.5px] text-[#737373]">
              Didn’t receive the code?{' '}
            </Text>
            <TouchableOpacity
              onPress={handleResend}
              disabled={countdown > 0}
              activeOpacity={0.7}
            >
              <Text className="text-[14.5px] text-[#737373]">Resend in </Text>
            </TouchableOpacity>
            <Text className="text-[14.5px] font-bold text-brand-primary">
              {formattedTimer}
            </Text>
          </View>

          {/* Or Divider */}
          <View className="flex-row items-center justify-center my-1 px-4">
            <View className="flex-1 h-[1px] bg-[#EBEFF5]" />
            <Text className="mx-3 text-[14px] text-brand-text-muted">or</Text>
            <View className="flex-1 h-[1px] bg-[#EBEFF5]" />
          </View>

          {/* Change Phone Number Link */}
          <TouchableOpacity
            className="items-center mt-3.5 mb-6"
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text className="text-[15px] font-semibold text-brand-primary">
              Change phone number
            </Text>
          </TouchableOpacity>

          {/* Bottom Security Card */}
          <View className="flex-row items-center bg-[#F8FAFD] rounded-2xl p-4 mt-auto border border-[#EFF3F8]">
            <View className="w-11 h-11 rounded-full bg-brand-badge-blue justify-center items-center mr-3.5">
              <Ionicons name="shield-checkmark" size={24} color={Colors.primary} />
            </View>
            <View className="flex-1">
              <Text className="text-[14.5px] font-bold text-[#1F1F1F] mb-0.5">
                Your information is secure
              </Text>
              <Text className="text-[13px] text-[#737373] leading-[18px]">
                We use industry-standard encryption to keep your data safe.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
