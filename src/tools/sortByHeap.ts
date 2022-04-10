export interface Item {
  value: number;
  index: number;
}
export default function heapSort(arr: Item[], n: number) {
  // 大顶堆
  arr = arr.slice();
  for (let i = Math.floor((arr.length - 1) / 2); i >= 0; i--) {
    bubbleHeap(arr, i, arr.length);
  }
  const result: Item[] = [];
  // 堆结构完成构造完成, 开始排序
  for (let end = arr.length - 1; end >= 0; end--) {
    result.push(arr[0])
    if (result.length >= n) {
      return result;
    }
    // 将头结点移到末尾
    [arr[0], arr[end]] = [arr[end], arr[0]];
    bubbleHeap(arr, 0, end - 1);
  }
  return result;
}

function bubbleHeap(heap: Item[], rootIndex: number, len: number) {
  let parent = rootIndex;
  let child = parent * 2 + 1;
  let recordElement = heap[parent];
  while (child < len) {
    if (child + 1 < len && heap[child + 1] > heap[child]) {
      child++;
    }
    if (recordElement.value >= heap[child].value) {
      break;
    }
    heap[parent] = heap[child];
    parent = child;
    child = parent * 2 + 1;
  }
  heap[parent] = recordElement;
}
