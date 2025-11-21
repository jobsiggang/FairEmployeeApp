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
    tableWidth,
    tableHeight,
    cellPaddingX,
    cellPaddingY,
    fontSize,
    backgroundColor,
    borderColor,
    borderWidth,
    rowHeight,
  } = tableConfig;

  // 회전 시 width/height 스왑 및 중앙 정렬
  const isRotated = rotation % 180 !== 0;
  const imgWidth = isRotated ? CANVAS_HEIGHT : CANVAS_WIDTH;
  const imgHeight = isRotated ? CANVAS_WIDTH : CANVAS_HEIGHT;
  const left = (CANVAS_WIDTH - imgWidth) / 2;
  const top = (CANVAS_HEIGHT - imgHeight) / 2;

  // 최소 글자수 기준
  const MIN_COL1_CHARS = 5;
  const MIN_COL2_CHARS =7;
  const CHAR_WIDTH = fontSize; // 한 글자 너비 픽셀 (대략 fontSize로 설정)

  // 열 폭 계산
  const col1FinalWidth = Math.max(
    ...tableEntries.map(e => (e.field || '').length),
    MIN_COL1_CHARS
  ) * CHAR_WIDTH + cellPaddingX * 2;

  const col2FinalWidth = Math.max(
    ...tableEntries.map(e => ((formData[e.field] || '').trim().length)),
    MIN_COL2_CHARS
  ) * CHAR_WIDTH + cellPaddingX * 2;

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
          backgroundColor,
          borderColor,
          borderWidth,
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {tableEntries.map((entry, index) => {
            const cellValue = (formData[entry.field] || '').trim();
            return (
              <View key={index} style={{
                flexDirection: 'row',
                borderBottomWidth: index < tableEntries.length - 1 ? 1 : 0,
                borderBottomColor: borderColor,
                height: rowHeight
              }}>
                <Text
                  style={{
                    width: col1FinalWidth,
                    paddingHorizontal: cellPaddingX,
                    paddingVertical: cellPaddingY,
                    fontSize,
                    color: tableConfig.textColor,
                    fontWeight: 'bold',
                    borderRightWidth: 1,
                    borderRightColor: borderColor,
                    fontFamily: "Malgun Gothic",
                    textAlignVertical: 'center',
                    textAlign: 'left',
                  }}
                  numberOfLines={1}
                  ellipsizeMode="tail"
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
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >{cellValue}</Text>
              </View>
            );
          })}
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
