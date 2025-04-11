import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function StatsScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Statistics</ThemedText>
      <ThemedText>Crime statistics and analytics coming soon!</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
}); 