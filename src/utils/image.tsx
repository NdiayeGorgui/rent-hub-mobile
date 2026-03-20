import React from "react";
import { View, Image, ScrollView, Pressable, StyleSheet, Dimensions } from "react-native";

type Props = {
  images: { uri: string }[];
  onRemove?: (index: number) => void; // optionnel pour supprimer
};

const { width } = Dimensions.get("window");

export default function ImageCarousel({ images, onRemove }: Props) {
  return (
    <ScrollView
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      style={{ marginVertical: 10 }}
    >
      {images.map((img, index) => (
        <View key={index} style={styles.imageContainer}>
          <Image
            source={{ uri: img.uri }}
            style={styles.image}
            resizeMode="cover"
          />
          {onRemove && (
            <Pressable
              style={styles.removeButton}
              onPress={() => onRemove(index)}
            >
              <View style={styles.removeCircle}>
                <Image
                  source={{ uri: "https://img.icons8.com/ios-filled/50/ffffff/multiply.png" }}
                  style={{ width: 20, height: 20 }}
                />
              </View>
            </Pressable>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    width: width - 40, // un peu de padding sur les côtés
    height: 250,
    marginRight: 10,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  removeButton: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  removeCircle: {
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 12,
    padding: 4,
  },
});