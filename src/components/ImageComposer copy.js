import React, { forwardRef } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import ViewShot from 'react-native-view-shot';

const ImageComposer = forwardRef(({
  selectedImage,
  rotation,
  canvasDims,
  tableEntries,
  tableConfig,
  formData
}, ref) => {
  const { width: CANVAS_WIDTH, height: CANVAS_HEIGHT } = canvasDims;
  const {
    col1FinalWidth,
    col2FinalWidth,
    tableWidth,
    tableHeight,
    cellPaddingX,
    cellPaddingY,
    fontSize
  } = tableConfig;

  // 회전 시 width/height 스왑 및 중앙 정렬
  const isRotated = rotation % 180 !== 0;
  const imgWidth = isRotated ? CANVAS_HEIGHT : CANVAS_WIDTH;
  const imgHeight = isRotated ? CANVAS_WIDTH : CANVAS_HEIGHT;
  const left = (CANVAS_WIDTH - imgWidth) / 2;
  const top = (CANVAS_HEIGHT - imgHeight) / 2;

  return (
    <View style={[styles.container, { width: CANVAS_WIDTH + 4, height: CANVAS_HEIGHT + 4 }]}>
      <ViewShot ref={ref} options={{ format: 'jpg', quality: 0.9 }} style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
        <Image
          source={{ uri: selectedImage.uri }}
          style={{
            position: 'absolute',
            left,
            top,
            width: imgWidth,
            height: imgHeight,
            resizeMode: 'stretch',
            transform: [{ rotate: `${rotation}deg` }],
          }}
        />
        {/* 표 오버레이 */}
        <View style={{
          position: 'absolute',
          left: 0,
          bottom: 0,
          width: tableWidth,
          height: tableHeight,
          backgroundColor: tableConfig.backgroundColor,
          borderColor: tableConfig.borderColor,
          borderWidth: tableConfig.borderWidth,
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {tableEntries.map((entry, index) => (
            <View key={index} style={{ flexDirection: 'row', borderBottomWidth: index < tableEntries.length - 1 ? 1 : 0, borderBottomColor: tableConfig.borderColor, height: tableConfig.rowHeight }}>
              <Text
                style={{
                  width: col1FinalWidth,
                  paddingHorizontal: cellPaddingX,
                  paddingVertical: cellPaddingY,
                  fontSize,
                  color: tableConfig.textColor,
                  fontWeight: 'bold',
                  borderRightWidth: 1,
                  borderRightColor: tableConfig.borderColor,
                  fontFamily: "Malgun Gothic",
                  textAlignVertical: 'center',
                  textAlign: 'left',
                }}
                numberOfLines={tableWidth >= CANVAS_WIDTH ? 1 : undefined}
                ellipsizeMode={tableWidth >= CANVAS_WIDTH ? "tail" : undefined}
              >{entry.field}</Text>
              <Text
                style={{
                  width: col2FinalWidth,
                  paddingHorizontal: cellPaddingX,
                  paddingVertical: cellPaddingY,
                  fontSize,
                  color: tableConfig.textColor,
                  fontWeight: 'bold',
                  fontFamily: "Malgun Gothic",
                  textAlignVertical: 'center',
                  textAlign: 'left',
                }}
                numberOfLines={tableWidth >= CANVAS_WIDTH ? 1 : undefined}
                ellipsizeMode={tableWidth >= CANVAS_WIDTH ? "tail" : undefined}
              >{formData[entry.field] || ''}</Text>
            </View>
          ))}
          <View style={{ width: 1, backgroundColor: tableConfig.borderColor }} />
        </View>
      </ViewShot>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    alignSelf: 'center',
    borderWidth: 3,
    borderColor: '#2563eb',
    borderRadius: 0,
    backgroundColor: '#fff',
    overflow: 'visible',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
});

export default ImageComposer;