export default function heapSort(arr: number[], n = 10, dropFirst = false) {
  // 大顶堆
  arr = arr.slice();
  for (let i = Math.floor((arr.length - 1) / 2); i >= 0; i--) {
    bubbleHeap(arr, i, arr.length);
  }
  const result: number[] = [];
  // 堆结构完成构造完成, 开始排序
  for (let end = arr.length - 1; end >= 0; end--) {
    if (!dropFirst || end !== arr.length - 1) {
      // 如果 dropFirst 开启, 则忽略第一个
      result.push(arr[0])
    }
    if (result.length >= n) {
      return result;
    }
    // 将头结点移到末尾
    [arr[0], arr[end]] = [arr[end], arr[0]];
    bubbleHeap(arr, 0, end - 1);
  }
  return result;
}

function bubbleHeap(heap: number[], rootIndex: number, len: number) {
  let parent = rootIndex;
  let child = parent * 2 + 1;
  let recordElement = heap[parent];
  while (child < len) {
    if (child + 1 < len && heap[child + 1] > heap[child]) {
      child++;
    }
    if (recordElement >= heap[child]) {
      break;
    }
    heap[parent] = heap[child];
    parent = child;
    child = parent * 2 + 1;
  }
  heap[parent] = recordElement;
}
