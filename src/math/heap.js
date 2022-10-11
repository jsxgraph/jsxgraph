import Mat from "math/math";
import Type from "utils/type";
  

  /**
   * Heap
   */
  Mat.Heap = function () {
    this.pq = [];
    this.N = 0;
  };

  /**
   * public
   */
  Mat.Heap.prototype.empty = function () {
    this.pq = [];
    this.N = 0;
  };

  Mat.Heap.prototype.insert = function (node) {
    this.pq[this.N] = node;
    this.N++;
    this.fixUp(this.N);
  };

  Mat.Heap.prototype.delmax = function () {
    this.exchange(0, this.N - 1);
    this.fixDown(0, this.N - 1);
    this.N--;

    return this.pq[this.N];
  };

  /**
   * private
   */
  Mat.Heap.prototype.fixUp = function (k) {
    var i = k - 1;

    while (i > 0 && this.pq[Math.floor(i / 2)].v < this.pq[i].v) {
      this.exchange(Math.floor(i / 2), i);
      i = Math.floor(i / 2);
    }
  };

  Mat.Heap.prototype.fixDown = function (k, N) {
    var j,
      i = k;
    while (2 * i < N) {
      j = 2 * i;

      if (j < N && this.pq[j].v < this.pq[j + 1].v) {
        j++;
      }

      if (this.pq[i].v >= this.pq[j].v) {
        break;
      }

      this.exchange(i, j);
      i = j;
    }
  };

  Mat.Heap.prototype.exchange = function (i, j) {
    var t = this.pq[i];
    this.pq[i] = this.pq[j];
    this.pq[j] = t;
  };

  export default Mat.Heap;

