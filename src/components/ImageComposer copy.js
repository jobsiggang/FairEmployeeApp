import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import ViewShot from 'react-native-view-shot';

const ImageComposer = ({ selectedImage, rotation, canvasDims, tableOverlay }) => {
  const { width: CANVAS_WIDTH, height: CANVAS_HEIGHT } = canvasDims;

  return (
    <View style={[styles.container, { width: CANVAS_WIDTH + 4, height: CANVAS_HEIGHT + 4 }]}>
      <ViewShot options={{ format: 'jpg', quality: 0.9 }} style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
        <Image
          source={{ uri: selectedImage.uri }}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            resizeMode: 'cover', // Changed from 'contain' to 'cover'
            transform: [{ rotate: `${rotation}deg` }],
          }}
        />
        {tableOverlay}
      </ViewShot>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    alignSelf: 'center',
    borderWidth: 3,
    borderColor: '#2563eb',
    borderRadius: 10,
    backgroundColor: '#fff',
    overflow: 'visible',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ImageComposer;