import React from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/theme';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const handleProceed = () => {
    router.push('/(auth)/phone');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Pressable
        className="flex-1 items-center justify-between py-2"
        onPress={handleProceed}
      >
        {/* Top Header & Branding */}
        <View className="items-center pt-2">
          <Image
            source={require('../../assets/images/carenet-emblem.png')}
            className="w-[114px] h-[96px] mb-1.5"
            resizeMode="contain"
          />
          <View className="flex-row items-center mb-1">
            <Text className="text-[38px] font-extrabold text-[#0F172A] tracking-tight">
              Care
            </Text>
            <Text className="text-[38px] font-extrabold text-brand-primary tracking-tight">
              Net
            </Text>
          </View>
          <Text className="text-[16.5px] text-[#737373] text-center leading-[23px] font-normal">
            {'Care. Connection.\nIndependence. Safety.'}
          </Text>
        </View>

        {/* Hero Photo / Wave Section */}
        <View
          className="w-full overflow-hidden"
          style={{ height: width * 0.96 }}
        >
          <Image
            source={require('../../assets/images/welcome-hero.png')}
            className="w-full h-full"
            resizeMode="cover"
          />
        </View>

        {/* Bottom Feature Badges */}
        <View className="flex-row justify-around w-full px-6 pb-4">
          {/* Feature 1 */}
          <View className="items-center w-[105px]">
            <View className="w-[62px] h-[62px] rounded-full justify-center items-center mb-2 bg-brand-badge-blue">
              <Ionicons name="heart" size={26} color={Colors.primary} />
            </View>
            <Text className="text-[14px] font-semibold text-[#1F1F1F] text-center leading-[18px]">
              {'Stay\nIndependent'}
            </Text>
          </View>

          {/* Feature 2 */}
          <View className="items-center w-[105px]">
            <View className="w-[62px] h-[62px] rounded-full justify-center items-center mb-2 bg-brand-badge-teal">
              <Ionicons name="people" size={26} color={Colors.teal} />
            </View>
            <Text className="text-[14px] font-semibold text-[#1F1F1F] text-center leading-[18px]">
              {'Stay\nConnected'}
            </Text>
          </View>

          {/* Feature 3 */}
          <View className="items-center w-[105px]">
            <View className="w-[62px] h-[62px] rounded-full justify-center items-center mb-2 bg-brand-badge-orange">
              <Ionicons name="shield-checkmark" size={26} color={Colors.warning} />
            </View>
            <Text className="text-[14px] font-semibold text-[#1F1F1F] text-center leading-[18px]">
              {'Stay\nSafe'}
            </Text>
          </View>
        </View>
      </Pressable>
    </SafeAreaView>
  );
}
