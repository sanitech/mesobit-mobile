import { TextInput, type TextInputProps, StyleSheet } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedTextInputProps = TextInputProps & {
  lightColor?: string;
  darkColor?: string;
  lightPlaceholderColor?: string;
  darkPlaceholderColor?: string;
  type?: 'default' | 'primary' | 'secondary' | 'danger' | 'success';
};

export function ThemedTextInput({
  style,
  lightColor,
  darkColor,
  lightPlaceholderColor,
  darkPlaceholderColor,
  type = 'default',
  ...rest
}: ThemedTextInputProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const placeholderColor = useThemeColor({ light: lightPlaceholderColor, dark: darkPlaceholderColor }, 'placeholderText');

  return (
    <TextInput
      style={[
        { color, backgroundColor },
        type === 'default' ? styles.default : undefined,
        type === 'primary' ? styles.primary : undefined,
        type === 'secondary' ? styles.secondary : undefined,
        type === 'danger' ? styles.danger : undefined,
        type === 'success' ? styles.success : undefined,
        style,
      ]}
      placeholderTextColor={placeholderColor}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  primary: {
    fontSize: 16,
    lineHeight: 24,
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#007bff',
  },
  secondary: {
    fontSize: 16,
    lineHeight: 24,
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#6c757d',
  },
  danger: {
    fontSize: 16,
    lineHeight: 24,
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#dc3545',
  },
  success: {
    fontSize: 16,
    lineHeight: 24,
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#28a745',
  },
});
