export interface Item {
  value: number;
  index: number;
}

class Heap {
  public data: Item[];
  constructor() {
    this.data = [];
    this.init();
  }
  // 下沉调整堆
  adjustHeapSink(start: number, len: number) {
    let parent = start;
    let child = parent * 2 + 1;
    let pit = this.data[parent];
    while (child < len) {
      if (
        child + 1 < len &&
        this.data[child + 1].value < this.data[child].value
      ) {
        child++;
      }
      if (this.data[child].value > pit.value) {
        break;
      }
      this.data[parent] = this.data[child];
      parent = child;
      child = parent * 2 + 1;
    }
    this.data[parent] = pit;
  }
  adjustHeapBubble(child: number) {
    let parent = Math.floor((child - 1) / 2);
    const pit = this.data[child];
    while (parent >= 0) {
      if (this.data[parent].value < pit.value) {
        break;
      }
      this.data[child] = this.data[parent];
      child = parent;
      parent = Math.floor(child / 2) - 1;
    }
    this.data[child] = pit;
  }
  init() {
    let len = this.data.length;
    for (let parent = Math.floor(len / 2) - 1; parent >= 0; parent--) {
      this.adjustHeapSink(parent, len);
    }
  }
  pop() {
    if (this.size() === 0) {
      return;
    }
    // 弹出堆顶元素后, 将最后一个元素移动到堆顶
    const result = this.data[0];
    const element = this.data.pop();
    if (this.size() > 1) {
      this.data[0] = element as Item;
      // 因为新元素位于顶堆, 下沉调整堆
      this.adjustHeapSink(0, this.data.length);
    }
    return result;
  }
  size() {
    return this.data.length;
  }
  peek() {
    return this.data[0];
  }
  push(val: Item) {
    // 插入一个元素后, 冒泡调整
    const len = this.data.push(val);
    this.adjustHeapBubble(len - 1);
  }
  getHeap() {
    return this.data;
  }
}
export default function TopN(arr: Item[], n = 50) {
  const heap = new Heap();
  for (let i = 0; i < arr.length; i++) {
    const item = arr[i];
    let len = heap.size();
    if ((0 <= len && len <= n) || item.value > heap.peek().value) {
      heap.push(item);
      if (heap.size() > n) {
        heap.pop();
      }
    }
  }
  return heap.getHeap();
}
