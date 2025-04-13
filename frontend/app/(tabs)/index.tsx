import React, { useEffect, useState } from 'react';
import { StyleSheet, Platform, TouchableOpacity, View, ActivityIndicator, ScrollView } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

type RiskLevel = 'A' | 'B' | 'C' | 'D';

const riskPrompts = {
  'A': 'You are advising a user in a **high-risk** area. Provide exactly 3 specific, actionable safety tips. Focus on immediate actions and serious warnings. Each tip must be under 20 words, direct, and urgent. Maintain a serious and respectful tone. Avoid fear-mongering. Assume the user may be walking, driving, or using public transport, alone or in a group, in any weather.',
  
  'B': 'You are advising a user in a **moderate-risk** area. Provide exactly 3 practical and realistic safety tips. Include both cautionary advice and positive actions. Each tip must be under 20 words. Tone should be cautious but reassuring. Assume the user may be moving through urban areas in various conditions and backgrounds.',
  
  'C': 'You are advising a user in a **low-risk** area. Provide exactly 3 friendly, general safety reminders. Keep tips positive, helpful, and under 20 words each. Tone should be calm and encouraging. Assume the user may be in a safe urban environment, either alone or with others.',
  
  'D': 'You are advising a user in a **very safe** area. Provide exactly 3 fun or interesting general safety facts. Keep it light, engaging, and under 20 words each. Maintain a cheerful, inclusive tone. Facts should still promote awareness but in a relaxed way. Assume users of all ages and backgrounds.'
};

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const [selectedRisk, setSelectedRisk] = useState<RiskLevel>('A');
  const [aiTips, setAiTips] = useState<string[]>([]);
  const [isLoadingTips, setIsLoadingTips] = useState(false);

  const handleRiskSelect = async (risk: RiskLevel) => {
    setSelectedRisk(risk);
    setIsLoadingTips(true);
    setAiTips([]);

    try {
      const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OpenAI API key not found');
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: riskPrompts[risk] }],
          temperature: 0.7,
        }),
      });

      const data = await response.json();
      const tips = data.choices[0].message.content.split('\n').filter((tip: string) => tip.trim());
      setAiTips(tips);
    } catch (error) {
      console.error('Error fetching tips:', error);
      setAiTips(['Failed to load tips. Please try again later.']);
    } finally {
      setIsLoadingTips(false);
    }
  };

  useEffect(() => {
    handleRiskSelect('A');
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Logo and Title */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <ThemedText style={styles.title}>SafeRoute</ThemedText>
          <ThemedText style={styles.subtitle}>Navigate with Confidence</ThemedText>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.riskLevelContainer}>
          <ThemedText style={styles.riskLevelTitle}>Tips for Risk Levels</ThemedText>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.riskLevelScroll}
          >
            <TouchableOpacity 
              style={[styles.riskLevelButton, selectedRisk === 'A' && styles.selectedRiskLevel]}
              onPress={() => handleRiskSelect('A')}
            >
              <FontAwesome name="exclamation-triangle" size={24} color={selectedRisk === 'A' ? '#FFFFFF' : '#1A237E'} />
              <ThemedText 
                style={[styles.riskLevelText, selectedRisk === 'A' && styles.selectedRiskLevelText]}
                lightColor={selectedRisk === 'A' ? '#FFFFFF' : '#1A237E'}
                darkColor={selectedRisk === 'A' ? '#FFFFFF' : '#1A237E'}
              >
                High Risk
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.riskLevelButton, selectedRisk === 'B' && styles.selectedRiskLevel]}
              onPress={() => handleRiskSelect('B')}
            >
              <FontAwesome name="warning" size={24} color={selectedRisk === 'B' ? '#FFFFFF' : '#1A237E'} />
              <ThemedText 
                style={[styles.riskLevelText, selectedRisk === 'B' && styles.selectedRiskLevelText]}
                lightColor={selectedRisk === 'B' ? '#FFFFFF' : '#1A237E'}
                darkColor={selectedRisk === 'B' ? '#FFFFFF' : '#1A237E'}
              >
                Moderate Risk
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.riskLevelButton, selectedRisk === 'C' && styles.selectedRiskLevel]}
              onPress={() => handleRiskSelect('C')}
            >
              <FontAwesome name="shield" size={24} color={selectedRisk === 'C' ? '#FFFFFF' : '#1A237E'} />
              <ThemedText 
                style={[styles.riskLevelText, selectedRisk === 'C' && styles.selectedRiskLevelText]}
                lightColor={selectedRisk === 'C' ? '#FFFFFF' : '#1A237E'}
                darkColor={selectedRisk === 'C' ? '#FFFFFF' : '#1A237E'}
              >
                Low Risk
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.riskLevelButton, selectedRisk === 'D' && styles.selectedRiskLevel]}
              onPress={() => handleRiskSelect('D')}
            >
              <FontAwesome name="smile-o" size={24} color={selectedRisk === 'D' ? '#FFFFFF' : '#1A237E'} />
              <ThemedText 
                style={[styles.riskLevelText, selectedRisk === 'D' && styles.selectedRiskLevelText]}
                lightColor={selectedRisk === 'D' ? '#FFFFFF' : '#1A237E'}
                darkColor={selectedRisk === 'D' ? '#FFFFFF' : '#1A237E'}
              >
                Very Safe
              </ThemedText>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {isLoadingTips ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#1A237E" />
              <ThemedText style={styles.loadingText}>Loading safety tips...</ThemedText>
            </View>
          ) : (
            <View style={styles.tipsContainer}>
              {aiTips.map((tip, index) => (
                <View key={index} style={styles.tipContainer}>
                  <FontAwesome name="info-circle" size={20} color="#4285F4" style={styles.tipIcon} />
                  <ThemedText style={styles.tipText}>{tip}</ThemedText>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 20,
  },
  header: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20,
    marginTop: 10,
  },
  titleContainer: {
    alignItems: 'center',
    width: '100%',
    paddingVertical: 8,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#1A237E',
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: 50,
    textAlignVertical: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#666666',
    textAlign: 'center',
  },
  content: {
    flex: 2,
  },
  riskLevelContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  riskLevelTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A237E',
    marginBottom: 16,
    textAlign: 'center',
  },
  riskLevelScroll: {
    paddingHorizontal: 10,
    gap: 12,
  },
  riskLevelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    backgroundColor: '#F5F7FF',
    borderWidth: 1.5,
    borderColor: '#1A237E',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  selectedRiskLevel: {
    backgroundColor: '#1A237E',
    borderColor: '#1A237E',
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  riskLevelText: {
    fontSize: 16,
    fontWeight: '600',
  },
  selectedRiskLevelText: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#1A237E',
  },
  tipsContainer: {
    gap: 16,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F5F7FF',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E8EAF6',
  },
  tipIcon: {
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: '#333333',
  },
});
