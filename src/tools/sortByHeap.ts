import { compose, DEBUG } from './functionStyleProgrammingTools';

// 先复习一下堆排序
function* range(start = 1, end = 10) {
  for (let i = start; i <= end; i++) {
    yield i;
  }
}

function shuffle(arr: number[]) {
  for (let i = 0; i < arr.length; i++) {
    const rangeIndex = Math.floor(Math.random() * arr.length);
    [arr[rangeIndex], arr[i]] = [arr[i], arr[rangeIndex]];
  }
  return arr;
}

const arr = shuffle([...range()]);

function heapSort(arr: number[]) {
  arr = arr.slice();

  for (let i = Math.floor((arr.length - 1) / 2); i >= 0; i--) {
    bubbleHeap(arr, i, arr.length);
  }
  // 堆结构完成构造完成, 开始排序
  for (let end = arr.length - 1; end >= 0; end--) {
    // 将头结点移到末尾
    [arr[0], arr[end]] = [arr[end], arr[0]];
    bubbleHeap(arr, 0, end - 1);
  }
  return arr;
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
compose(DEBUG, heapSort)(arr);
