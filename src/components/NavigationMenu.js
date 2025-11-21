import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const NavigationMenu = ({ navigation, activeScreen }) => {
  return (
    <View style={styles.menuContainer}>
      <View style={[styles.menuItem, activeScreen === 'Upload' && styles.activeMenuItem]}>
        <Text style={[styles.menuText, activeScreen === 'Upload' && styles.activeMenuText]}>📸 사진 업로드</Text>
      </View>
      <TouchableOpacity
        style={[styles.menuItem, activeScreen === 'History' && styles.activeMenuItem]}
        onPress={() => navigation.navigate('History')}>
        <Text style={[styles.menuText, activeScreen === 'History' && styles.activeMenuText]}>📋 전송내역</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  menuContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f3f4f6',
    paddingVertical: 10,
  },
  menuItem: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  activeMenuItem: {
    backgroundColor: '#2563eb',
  },
  menuText: {
    fontSize: 16,
    color: '#222',
  },
  activeMenuText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default NavigationMenu;