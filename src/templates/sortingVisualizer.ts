import { Template } from '../types';

export const sortingVisualizerTemplate: Template = {
  id: 'sorting-visualizer',
  name: 'Sorting Visualizer',
  description: 'Animated visualization of classic sorting algorithms.',
  category: 'simulation',
  params: [
    { id: 'arraySize', name: 'Array Size', type: 'number', default: 80, min: 10, max: 300, step: 5, category: 'layout', description: 'Number of elements to sort' },
    { id: 'speed', name: 'Speed', type: 'number', default: 20, min: 1, max: 120, step: 1, category: 'animation', description: 'Sorting speed (comparisons per frame)' },
    { id: 'algorithm', name: 'Algorithm', type: 'enum', default: 'bubble', options: ['bubble', 'selection', 'insertion', 'quick', 'merge', 'heap'], category: 'simulation' },
    { id: 'barColor', name: 'Bar Color', type: 'color', default: '#4d96ff', category: 'color' },
    { id: 'activeColor', name: 'Active Color', type: 'color', default: '#ff6b6b', category: 'color', description: 'Color of bars being compared' },
    { id: 'sortedColor', name: 'Sorted Color', type: 'color', default: '#6bcb77', category: 'color', description: 'Color of sorted elements' },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#0a0a0a', category: 'color' }
  ],
  presets: [
    {
      name: 'Quick Sort',
      params: { arraySize: 150, speed: 60, algorithm: 'quick', barColor: '#00e5ff', activeColor: '#ff0054', sortedColor: '#39ff14', bgColor: '#000000' }
    },
    {
      name: 'Merge Sort Calm',
      params: { arraySize: 100, speed: 15, algorithm: 'merge', barColor: '#c77dff', activeColor: '#ff6b9d', sortedColor: '#00b4d8', bgColor: '#0a0a0a' }
    }
  ],
  generateCode: (params, seed) => `
    let arr = [];
    let arraySize = ${params.arraySize};
    let alg = '${params.algorithm}';
    let comparisons = [];
    let sortedIndices = new Set();
    let sortingDone = false;

    function setup() {
      createCanvas(windowWidth, windowHeight);
      for (let i = 0; i < arraySize; i++) arr.push(random(height * 0.9));
      startSort();
    }

    function startSort() {
      if (alg === 'bubble') bubbleSort();
      else if (alg === 'selection') selectionSort();
      else if (alg === 'insertion') insertionSort();
      else if (alg === 'quick') quickSort(0, arr.length - 1);
      else if (alg === 'merge') mergeSort(0, arr.length - 1);
      else if (alg === 'heap') heapSort();
    }

    function* bubbleSort() {
      for (let i = 0; i < arr.length; i++) {
        for (let j = 0; j < arr.length - i - 1; j++) {
          if (arr[j] > arr[j + 1]) {
            [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
          }
          comparisons.push([j, j + 1]);
          yield;
        }
        sortedIndices.add(arr.length - 1 - i);
      }
      sortingDone = true;
    }

    function* selectionSort() {
      for (let i = 0; i < arr.length; i++) {
        let minIdx = i;
        for (let j = i + 1; j < arr.length; j++) {
          if (arr[j] < arr[minIdx]) minIdx = j;
          comparisons.push([j, minIdx]);
          yield;
        }
        [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
        sortedIndices.add(i);
      }
      sortingDone = true;
    }

    function* insertionSort() {
      for (let i = 1; i < arr.length; i++) {
        let key = arr[i];
        let j = i - 1;
        while (j >= 0 && arr[j] > key) {
          arr[j + 1] = arr[j];
          comparisons.push([j, j + 1]);
          j--;
          yield;
        }
        arr[j + 1] = key;
        sortedIndices.add(i);
      }
      sortingDone = true;
    }

    function* quickSort(lo, hi) {
      if (lo >= hi) return;
      let p = yield* partition(lo, hi);
      sortedIndices.add(p);
      yield* quickSort(lo, p - 1);
      yield* quickSort(p + 1, hi);
      if (lo === 0 && hi === arr.length - 1) sortingDone = true;
    }

    function* partition(lo, hi) {
      let pivot = arr[hi];
      let i = lo - 1;
      for (let j = lo; j < hi; j++) {
        if (arr[j] < pivot) {
          i++;
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        comparisons.push([j, hi]);
        yield;
      }
      [arr[i + 1], arr[hi]] = [arr[hi], arr[i + 1]];
      return i + 1;
    }

    function* mergeSort(lo, hi) {
      if (lo >= hi) { sortedIndices.add(lo); return; }
      let mid = floor((lo + hi) / 2);
      yield* mergeSort(lo, mid);
      yield* mergeSort(mid + 1, hi);
      yield* merge(lo, mid, hi);
      for (let i = lo; i <= hi; i++) sortedIndices.add(i);
      if (lo === 0 && hi === arr.length - 1) sortingDone = true;
    }

    function* merge(lo, mid, hi) {
      let left = arr.slice(lo, mid + 1);
      let right = arr.slice(mid + 1, hi + 1);
      let i = 0, j = 0, k = lo;
      while (i < left.length && j < right.length) {
        if (left[i] <= right[j]) { arr[k] = left[i]; i++; }
        else { arr[k] = right[j]; j++; }
        comparisons.push([k, k]);
        yield;
        k++;
      }
      while (i < left.length) { arr[k] = left[i]; i++; k++; }
      while (j < right.length) { arr[k] = right[j]; j++; k++; }
    }

    function* heapSort() {
      for (let i = floor(arr.length / 2) - 1; i >= 0; i--) yield* heapify(arr.length, i);
      for (let i = arr.length - 1; i > 0; i--) {
        [arr[0], arr[i]] = [arr[i], arr[0]];
        sortedIndices.add(i);
        yield* heapify(i, 0);
      }
      sortedIndices.add(0);
      sortingDone = true;
    }

    function* heapify(n, i) {
      let largest = i;
      let l = 2 * i + 1, r = 2 * i + 2;
      if (l < n && arr[l] > arr[largest]) largest = l;
      if (r < n && arr[r] > arr[largest]) largest = r;
      if (largest !== i) {
        [arr[i], arr[largest]] = [arr[largest], arr[i]];
        comparisons.push([i, largest]);
        yield;
        yield* heapify(n, largest);
      }
    }

    let generator = null;
    let frameCount = 0;

    function draw() {
      background('${params.bgColor}');
      let barW = width / arraySize;

      if (!sortingDone && generator) {
        frameCount++;
        let speed = ${params.speed};
        for (let i = 0; i < speed; i++) {
          if (generator.next().done) break;
        }
      }

      let activeSet = new Set();
      if (comparisons.length > 0) {
        let last = comparisons[comparisons.length - 1];
        activeSet.add(last[0]);
        activeSet.add(last[1]);
      }

      for (let i = 0; i < arr.length; i++) {
        if (sortedIndices.has(i)) fill('${params.sortedColor}');
        else if (activeSet.has(i)) fill('${params.activeColor}');
        else fill('${params.barColor}');
        noStroke();
        rect(i * barW, height - arr[i], barW - 1, arr[i]);
      }
    }

    function windowResized() {
      resizeCanvas(windowWidth, windowHeight);
    }
  `
};
