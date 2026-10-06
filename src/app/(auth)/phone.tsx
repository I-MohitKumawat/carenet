import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ProgressBar } from '../../components/auth/ProgressBar';
import { PrimaryButton } from '../../components/common/PrimaryButton';

const { width } = Dimensions.get('window');

export default function PhoneEntryScreen() {
  const [phoneNumber, setPhoneNumber] = useState('98765 43210');

  const formatPhoneNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 10);
    if (cleaned.length > 5) {
      return `${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }
    return cleaned;
  };

  const handleChangeText = (text: string) => {
    setPhoneNumber(formatPhoneNumber(text));
  };

  const handleContinue = () => {
    router.push({
      pathname: '/(auth)/otp',
      params: { phone: phoneNumber || '98765 43210' },
    });
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
            justifyContent: 'space-between',
            paddingHorizontal: 24,
            paddingTop: 8,
            paddingBottom: 20,
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
              <ProgressBar currentStep={1} totalSteps={3} />
            </View>

            <View className="w-10" />
          </View>

          {/* Main Form Content */}
          <View className="mt-4">
            <Text className="text-[32px] font-extrabold text-[#0F172A] tracking-tight leading-[38px]">
              {'Let’s get you\nconnected.'}
            </Text>
            <Text className="text-[15px] text-[#737373] mt-2 font-normal">
              Enter your phone number to continue.
            </Text>

            {/* Input Field Container */}
            <View className="mt-5">
              <Text className="text-[14px] font-semibold text-[#1F1F1F] mb-2">
                Phone number
              </Text>
              <View className="flex-row items-center h-[54px] border-[1.2px] border-brand-border rounded-[14px] bg-white px-3">
                <TouchableOpacity
                  className="flex-row items-center pr-2"
                  activeOpacity={0.7}
                >
                  <Text className="text-[20px] mr-1.5">🇮🇳</Text>
                  <Text className="text-[16px] font-semibold text-[#1F1F1F]">
                    +91
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={14}
                    color="#1F1F1F"
                    style={{ marginLeft: 6 }}
                  />
                </TouchableOpacity>

                <View className="w-[1px] h-7 bg-brand-border mr-3" />

                <TextInput
                  className="flex-1 text-[17px] font-medium text-[#1F1F1F] py-0 tracking-wide"
                  value={phoneNumber}
                  onChangeText={handleChangeText}
                  placeholder="98765 43210"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  maxLength={11}
                  returnKeyType="done"
                />
              </View>
            </View>

            {/* Continue Primary Button */}
            <PrimaryButton
              title="Continue"
              onPress={handleContinue}
              className="mt-5"
            />

            {/* SMS Disclaimer Centered */}
            <View className="flex-row items-start justify-center mt-4 px-4">
              <Ionicons
                name="lock-closed"
                size={14}
                color="#737373"
                style={{ marginRight: 6, marginTop: 2 }}
              />
              <Text className="text-[12.5px] text-[#737373] leading-[18px] text-center">
                {'We’ll send you a verification code via SMS.\nStandard message rates may apply.'}
              </Text>
            </View>
          </View>

          {/* Lower Illustration */}
          <View
            className="items-center justify-center mt-2.5 mb-1"
            style={{ width: width - 48, height: 200 }}
          >
            <Image
              source={require('../../../assets/images/auth-phone-illustration.png')}
              className="w-full h-full"
              resizeMode="contain"
            />
          </View>

          {/* Footer Terms */}
          <View className="items-center mt-1">
            <Text className="text-[13px] text-[#737373] leading-[18px]">
              By continuing, you agree to our
            </Text>
            <View className="flex-row items-center">
              <TouchableOpacity activeOpacity={0.7}>
                <Text className="text-[13px] font-semibold text-brand-primary leading-[18px]">
                  Terms of Service
                </Text>
              </TouchableOpacity>
              <Text className="text-[13px] text-[#737373] leading-[18px]">
                {' and '}
              </Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text className="text-[13px] font-semibold text-brand-primary leading-[18px]">
                  Privacy Policy.
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
