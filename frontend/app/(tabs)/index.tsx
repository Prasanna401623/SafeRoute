import React, { useEffect, useState } from 'react';
import { StyleSheet, Platform, TouchableOpacity, View, ActivityIndicator, Modal } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import * as Location from 'expo-location';
import { API_BASE_URL } from '@/constants/config';
import { OPENAI_API_KEY } from '@/config/env';
import { router } from 'expo-router';

type RiskLevel = 'A' | 'B' | 'C' | 'D';

export default function HomeScreen() {
  const [currentRisk, setCurrentRisk] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<RiskLevel | ''>('');
  const [aiTips, setAiTips] = useState<string[]>([]);
  const [isLoadingTips, setIsLoadingTips] = useState(false);
  const [showRiskModal, setShowRiskModal] = useState(false);

  useEffect(() => {
    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    // Get initial risk level
    getCurrentRisk();

    return () => clearInterval(timer);
  }, []);

  const getCurrentRisk = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({});
      const response = await fetch(
        `${API_BASE_URL}/risk/?lat=${location.coords.latitude}&lon=${location.coords.longitude}&radius=0.1`
      );
      const data = await response.json();
      setCurrentRisk(data.risk_category);
    } catch (error) {
      console.error('Error getting risk level:', error);
    }
  };

  const getTimeBasedTips = () => {
    const hour = currentTime.getHours();
    if (hour >= 18 || hour <= 6) {
      return [
        {
          icon: 'lightbulb-o',
          color: '#F4B400',
          text: 'Stay in well-lit areas and avoid dark alleys',
        },
        {
          icon: 'group',
          color: '#0F9D58',
          text: 'Travel in groups when possible during night hours',
        },
      ];
    } else {
      return [
        {
          icon: 'eye',
          color: '#4285F4',
          text: 'Stay aware of your surroundings',
        },
        {
          icon: 'map-marker',
          color: '#DB4437',
          text: 'Keep to main paths and populated areas',
        },
      ];
    }
  };

  const getRiskBasedTips = () => {
    if (!currentRisk) return [];
    
    switch (currentRisk) {
      case 'A':
        return [{
          icon: 'exclamation-triangle',
          color: '#DB4437',
          text: 'High risk area detected. Consider alternative routes',
        }];
      case 'B':
        return [{
          icon: 'warning',
          color: '#F4B400',
          text: 'Moderate risk area. Stay alert and avoid isolated spots',
        }];
      default:
        return [];
    }
  };

  const tips = [...getTimeBasedTips(), ...getRiskBasedTips()];

  const getOpenAITips = async (riskLevel: RiskLevel) => {
    if (!riskLevel) return;
    
    setIsLoadingTips(true);
    try {
      const prompts: Record<RiskLevel, string> = {
        'A': 'You are advising a user in a **high-risk** area. Provide exactly 3 specific, actionable safety tips. Focus on immediate actions and serious warnings. Each tip must be under 20 words, direct, and urgent. Maintain a serious and respectful tone. Avoid fear-mongering. Assume the user may be walking, driving, or using public transport, alone or in a group, in any weather.',
        
        'B': 'You are advising a user in a **moderate-risk** area. Provide exactly 3 practical and realistic safety tips. Include both cautionary advice and positive actions. Each tip must be under 20 words. Tone should be cautious but reassuring. Assume the user may be moving through urban areas in various conditions and backgrounds.',
        
        'C': 'You are advising a user in a **low-risk** area. Provide exactly 3 friendly, general safety reminders. Keep tips positive, helpful, and under 20 words each. Tone should be calm and encouraging. Assume the user may be in a safe urban environment, either alone or with others.',
        
        'D': 'You are advising a user in a **very safe** area. Provide exactly 3 fun or interesting general safety facts. Keep it light, engaging, and under 20 words each. Maintain a cheerful, inclusive tone. Facts should still promote awareness but in a relaxed way. Assume users of all ages and backgrounds.'
      };

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a safety advisor providing tips based on risk levels. Keep responses concise and appropriate for the risk level.',
            },
            {
              role: 'user',
              content: prompts[riskLevel],
            },
          ],
        }),
      });

      const json = await response.json();
      const tips = json.choices[0].message.content.split('\n').filter((tip: string) => tip.trim());
      setAiTips(tips);
    } catch (error) {
      console.error('Error fetching OpenAI tips:', error);
      setAiTips([]);
    } finally {
      setIsLoadingTips(false);
    }
  };

  const handleRiskLevelChange = (value: RiskLevel | '') => {
    setSelectedRiskLevel(value);
    setShowRiskModal(false);
    if (value) {
      getOpenAITips(value);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={styles.title}>SafeRoute</ThemedText>
        <ThemedText style={styles.subtitle}>Navigate with Confidence</ThemedText>
      </View>

      {/* Main Content */}
      <View style={styles.contentContainer}>
        {/* Risk Level Selector */}
        <TouchableOpacity 
          style={styles.riskSelector}
          onPress={() => setShowRiskModal(true)}
        >
          <FontAwesome name="chevron-down" size={16} color="#666666" />
          <ThemedText style={styles.riskSelectorText}>
            {selectedRiskLevel ? `Risk Level ${selectedRiskLevel}` : 'Select Risk Level'}
          </ThemedText>
        </TouchableOpacity>

        {/* Risk Level Modal */}
        <Modal
          visible={showRiskModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowRiskModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>Select Risk Level</ThemedText>
                <TouchableOpacity onPress={() => setShowRiskModal(false)}>
                  <FontAwesome name="close" size={20} color="#666666" />
                </TouchableOpacity>
              </View>
              <View style={styles.modalOptions}>
                <TouchableOpacity 
                  style={styles.modalOption}
                  onPress={() => handleRiskLevelChange('A')}
                >
                  <FontAwesome name="exclamation-triangle" size={20} color="#DB4437" />
                  <ThemedText style={styles.modalOptionText}>High Risk (A)</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.modalOption}
                  onPress={() => handleRiskLevelChange('B')}
                >
                  <FontAwesome name="warning" size={20} color="#F4B400" />
                  <ThemedText style={styles.modalOptionText}>Moderate Risk (B)</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.modalOption}
                  onPress={() => handleRiskLevelChange('C')}
                >
                  <FontAwesome name="check-circle" size={20} color="#0F9D58" />
                  <ThemedText style={styles.modalOptionText}>Low Risk (C)</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.modalOption}
                  onPress={() => handleRiskLevelChange('D')}
                >
                  <FontAwesome name="smile-o" size={20} color="#4285F4" />
                  <ThemedText style={styles.modalOptionText}>Very Safe (D)</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Tips Section */}
        {isLoadingTips ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#1A237E" />
            <ThemedText style={styles.loadingText}>Loading safety tips...</ThemedText>
          </View>
        ) : (
          <View style={styles.tipsContainer}>
            {tips.map((tip, index) => (
              <View key={index} style={styles.tipContainer}>
                <FontAwesome name={tip.icon} size={20} color={tip.color} style={styles.tipIcon} />
                <ThemedText style={styles.tipText}>{tip.text}</ThemedText>
              </View>
            ))}
            
            {aiTips.map((tip, index) => (
              <View key={`ai-${index}`} style={styles.tipContainer}>
                <FontAwesome name="exclamation-circle" size={20} color="#4285F4" style={styles.tipIcon} />
                <ThemedText style={styles.tipText}>{tip}</ThemedText>
              </View>
            ))}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    marginTop: Platform.OS === 'ios' ? 40 : 20,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#1A237E',
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: 50,
    paddingTop: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666666',
    textAlign: 'center',
  },
  contentContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    marginTop: -100,
  },
  riskSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  riskSelectorText: {
    flex: 1,
    fontSize: 18,
    color: '#333333',
    marginLeft: 12,
    fontWeight: '500',
  },
  tipsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tipIcon: {
    marginRight: 16,
  },
  tipText: {
    fontSize: 16,
    color: '#333333',
    flex: 1,
    lineHeight: 24,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingText: {
    marginLeft: 8,
    color: '#666666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '80%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A237E',
  },
  modalOptions: {
    padding: 16,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333333',
    marginLeft: 12,
  },
});
