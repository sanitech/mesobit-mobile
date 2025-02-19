import React from "react";
import { View, Text, StyleSheet, ScrollView, useColorScheme } from "react-native";

const FAQScreen = () => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const styles = createStyles(isDarkMode);

  const faqs = [
    { question: "How do I reset my password?", answer: "Go to settings and click on 'Reset Password'." },
    { question: "How to contact support?", answer: "Contact us via email at support@example.com." },
    { question: "Where can I find the user guide?", answer: "Visit our website under the 'Resources' section." },
    { question: "How to update my profile?", answer: "Navigate to the Profile section and edit your details." },
    // Add more FAQs as needed
  ];

  return (
    <View style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Frequently Asked Questions</Text>
        {faqs.map((faq, index) => (
          <View key={index} style={styles.faqContainer}>
            <Text style={styles.question}>{faq.question}</Text>
            <Text style={styles.answer}>{faq.answer}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const createStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: isDarkMode ? "#121212" : "#fff",
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: isDarkMode ? "#fff" : "#000",
      marginBottom: 20,
    },
    faqContainer: {
      marginBottom: 20,
      padding: 10,
      backgroundColor: isDarkMode ? "#1e1e1e" : "#f8f8f8",
      borderRadius: 8,
    },
    question: {
      fontSize: 18,
      fontWeight: "600",
      color: isDarkMode ? "#fff" : "#000",
      marginBottom: 5,
    },
    answer: {
      fontSize: 16,
      color: isDarkMode ? "#bbb" : "#333",
    },
  });

export default FAQScreen;
