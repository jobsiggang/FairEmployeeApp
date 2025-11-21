import React, { forwardRef } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import ViewShot from 'react-native-view-shot';

const ImageComposer = forwardRef(({ selectedImage, rotation, canvasDims, tableOverlay }, ref) => {
  const { width: CANVAS_WIDTH, height: CANVAS_HEIGHT } = canvasDims;

  return (
    <View style={[styles.container, { width: CANVAS_WIDTH + 4, height: CANVAS_HEIGHT + 4 }]}>
      <ViewShot ref={ref} options={{ format: 'jpg', quality: 0.9 }} style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
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
});

const VerticalDivider = () => (
  <View style={styles.divider} />
);

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
  divider: {
    width: 1,
    backgroundColor: 'gray',
    height: '100%',
    marginHorizontal: 10,
  },
});

export default ImageComposer;