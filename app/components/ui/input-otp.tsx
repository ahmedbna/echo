import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  NativeSyntheticEvent,
  Platform,
  Pressable,
  TextInput,
  TextInputKeyPressEventData,
  TextInputProps,
  TextStyle,
  ViewStyle,
} from 'react-native';

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';

import * as Haptics from 'expo-haptics';

import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';

const triggerHaptic = (style: Haptics.ImpactFeedbackStyle) => {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(style);
  }
};

export interface InputOTPProps extends Omit<
  TextInputProps,
  'style' | 'value' | 'onChangeText'
> {
  length?: number;
  value?: string;
  onChangeText?: (value: string) => void;
  onComplete?: (value: string) => void;
  error?: string;
  disabled?: boolean;
  containerStyle?: ViewStyle;
  slotStyle?: ViewStyle;
  errorStyle?: TextStyle;
  masked?: boolean;
  separator?: React.ReactNode;
  showCursor?: boolean;
}

export interface InputOTPRef {
  focus: () => void;
  blur: () => void;
  clear: () => void;
  getValue: () => string;
}

export const InputOTP = forwardRef<InputOTPRef, InputOTPProps>(
  (
    {
      length = 6,
      value = '',
      onChangeText,
      onComplete,
      error,
      disabled = false,
      containerStyle,
      slotStyle,
      errorStyle,
      masked = false,
      separator,
      showCursor = true,
      onFocus,
      onBlur,
      ...textInputProps
    },
    ref,
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<TextInput>(null);

    const focusAnim = useSharedValue(0);

    const normalizedValue = value.slice(0, length);
    const currentActiveIndex = Math.min(normalizedValue.length, length - 1);

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
      clear: () => onChangeText?.(''),
      getValue: () => normalizedValue,
    }));

    const handleChangeText = useCallback(
      (text: string) => {
        const cleanText = text.replace(/[^0-9]/g, '');
        const limitedText = cleanText.slice(0, length);

        onChangeText?.(limitedText);

        if (limitedText.length === length) {
          triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
          onComplete?.(limitedText);
        }
      },
      [length, onChangeText, onComplete],
    );

    const handleKeyPress = useCallback(
      (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
        const { key } = e.nativeEvent;

        if (key === 'Backspace' && normalizedValue.length > 0) {
          const newValue = normalizedValue.slice(0, -1);
          onChangeText?.(newValue);
          triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
        }
      },
      [normalizedValue, onChangeText],
    );

    const handleFocus = useCallback(
      (e: any) => {
        setIsFocused(true);
        focusAnim.value = withSpring(1, { damping: 15 });
        triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
        onFocus?.(e);
      },
      [onFocus],
    );

    const handleBlur = useCallback(
      (e: any) => {
        setIsFocused(false);
        focusAnim.value = withSpring(0, { damping: 15 });
        onBlur?.(e);
      },
      [onBlur],
    );

    const animatedSlotStyle = useAnimatedStyle(() => {
      const translateY = interpolate(focusAnim.value, [0, 1], [0, 3]);
      return { transform: [{ translateY }] };
    });

    const handleSlotPress = () => {
      if (!disabled) {
        inputRef.current?.focus();
      }
    };

    const slots = Array.from({ length }, (_, index) => {
      const hasValue = index < normalizedValue.length;
      const isActive = isFocused && index === currentActiveIndex;

      const displayValue = hasValue
        ? masked
          ? '•'
          : normalizedValue[index]
        : '';

      return (
        <React.Fragment key={index}>
          <View style={{ width: 58, height: 58, position: 'relative' }}>
            {/* Bottom shadow layer */}
            <View
              style={{
                backgroundColor: '#38383A',
                position: 'absolute',
                top: 6,
                left: 0,
                right: 0,
                height: 58,
                borderRadius: 20,
                zIndex: 1,
              }}
            />

            {/* Top squishy layer */}
            <Animated.View
              style={[
                {
                  backgroundColor: '#1C1C1E',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 58,
                  borderRadius: 20,
                  borderWidth: 4,
                  borderColor: error
                    ? '#FF3B30'
                    : isActive
                      ? '#FAD40B'
                      : '#38383A',
                  zIndex: 2,
                  justifyContent: 'center',
                  alignItems: 'center',
                },
                animatedSlotStyle,
                slotStyle,
              ]}
            >
              <Pressable
                onPress={handleSlotPress}
                style={{
                  width: '100%',
                  height: '100%',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: '700',
                    color: hasValue ? '#FFF' : '#a1a1aa',
                  }}
                >
                  {displayValue}
                </Text>

                {showCursor && isActive && !hasValue && (
                  <View
                    style={{
                      position: 'absolute',
                      width: 2,
                      height: 22,
                      backgroundColor: '#FAD40B',
                    }}
                  />
                )}
              </Pressable>
            </Animated.View>
          </View>

          {separator && index < length - 1 && (
            <View style={{ marginHorizontal: 4 }}>{separator}</View>
          )}
        </React.Fragment>
      );
    });

    return (
      <View style={[{ width: '100%' }, containerStyle]}>
        {/* Hidden real input */}
        <TextInput
          ref={inputRef}
          value={normalizedValue}
          onChangeText={handleChangeText}
          onKeyPress={handleKeyPress}
          onFocus={handleFocus}
          onBlur={handleBlur}
          keyboardType='number-pad'
          maxLength={length}
          editable={!disabled}
          selectionColor='transparent'
          style={{
            position: 'absolute',
            left: -9999,
            opacity: 0,
          }}
          {...textInputProps}
        />

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: separator ? 0 : 4,
          }}
        >
          {slots}
        </View>

        {error && (
          <Text
            style={[
              {
                color: '#FF3B30',
                fontSize: 14,
                marginTop: 10,
                marginLeft: 4,
                fontWeight: '600',
                textAlign: 'center',
              },
              errorStyle,
            ]}
          >
            {error}
          </Text>
        )}
      </View>
    );
  },
);

InputOTP.displayName = 'InputOTP';

// Preset with dash separator
export const InputOTPWithSeparator = forwardRef<
  InputOTPRef,
  Omit<InputOTPProps, 'separator'>
>((props, ref) => (
  <InputOTP
    ref={ref}
    separator={<Text style={{ fontSize: 18, color: '#a1a1aa' }}>-</Text>}
    {...props}
  />
));

InputOTPWithSeparator.displayName = 'InputOTPWithSeparator';
