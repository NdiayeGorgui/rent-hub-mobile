import React from "react";
import {
  FlatList,
  RefreshControl,
  View,
  Text,
  ListRenderItem,
} from "react-native";

type CustomFlatListProps<T> = {
  data: T[];
  renderItem: ListRenderItem<T>;
  keyExtractor: (item: T, index: number) => string;

  refreshing: boolean;
  onRefresh: () => void;

  emptyText?: string;
  emptyIcon?: string;
};

export function CustomFlatList<T>({
  data,
  renderItem,
  keyExtractor,
  refreshing,
  onRefresh,
  emptyText = "Aucune donnée",
  emptyIcon = "📭",
}: CustomFlatListProps<T>) {
  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}

      contentContainerStyle={
        data.length === 0 ? { flexGrow: 1, justifyContent: "center" } : undefined
      }

      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }

      ListEmptyComponent={
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 50 }}>{emptyIcon}</Text>
          <Text style={{ color: "#999", marginTop: 10 }}>
            {emptyText}
          </Text>
        </View>
      }
    />
  );
}