/* jshint esnext: true*/
(function(scope){ // es6, do I need this?

// TODO: polyfill, should check for support before using it.
var owner = HTMLImports.currentScript.ownerDocument;

var emptySquare = owner.querySelector("#emptyTemplate"),

    pieces = {
      P: owner.querySelector("#whitePawnTemplate"),      // ♙ white
      N: owner.querySelector("#whiteKnightTemplate"),    // ♘
      B: owner.querySelector("#whiteBishopTemplate"),    // ♗
      R: owner.querySelector("#whiteRookTemplate"),      // ♖
      Q: owner.querySelector("#whiteQueenTemplate"),     // ♕
      K: owner.querySelector("#whiteKingTemplate"),      // ♔
      p: owner.querySelector("#blackPawnTemplate"),      // ♟ black
      n: owner.querySelector("#blackKnightTemplate"),    // ♞
      b: owner.querySelector("#blackBishopTemplate"),    // ♝
      r: owner.querySelector("#blackRookTemplate"),      // ♜
      q: owner.querySelector("#blackQueenTemplate"),     // ♛
      k: owner.querySelector("#blackKingTemplate")       // ♚
    },

    svgPieces = {
      P: owner.querySelector("#whitePawnSvgTemplate"),   // ♙ white
      N: owner.querySelector("#whiteKnightSvgTemplate"), // ♘
      B: owner.querySelector("#whiteBishopSvgTemplate"), // ♗
      R: owner.querySelector("#whiteRookSvgTemplate"),   // ♖
      Q: owner.querySelector("#whiteQueenSvgTemplate"),  // ♕
      K: owner.querySelector("#whiteKingSvgTemplate"),   // ♔
      p: owner.querySelector("#blackPawnSvgTemplate"),   // ♟ black
      n: owner.querySelector("#blackKnightSvgTemplate"), // ♞
      b: owner.querySelector("#blackBishopSvgTemplate"), // ♝
      r: owner.querySelector("#blackRookSvgTemplate"),   // ♜
      q: owner.querySelector("#blackQueenSvgTemplate"),  // ♛
      k: owner.querySelector("#blackKingSvgTemplate")    // ♚
    },

    template = owner.querySelector("#chessBoardTemplate"),
    frameTemplate = owner.querySelector("#chessBoardFrameTemplate"),

    ranks = {1: 7, 2: 6, 3: 5, 4: 4, 5: 3, 6: 2, 7: 1, 8: 0},
    files = {a: 0, b: 1, c: 2, d: 3, e: 4, f: 5, g: 6, h: 7};

class ChessBoard extends HTMLElement {
  constructor() {
    this.unicode = !!this.attributes.unicode;
    this.board = null; // keep a reference to the board table.

    this.boardRoot = this.createShadowRoot();
    this.fen = this.innerHTML.trim();

    this.frameRoot = this.createShadowRoot();
    var frameClone = frameTemplate.content.cloneNode(true);
    this.frameRoot.appendChild(frameClone);
  }

  clearBoard() {
    var clone = template.content.cloneNode(true);
    removeNodeContent(this.boardRoot);
    this.boardRoot.appendChild(clone);
    this.board = this.shadowRoot.querySelector(".chessBoard");
  }

  move(from, to) {
    var fromFile = files[from[0]],
        fromRank = ranks[from[1]],
        fromCell = this.board.rows[fromRank].cells[fromFile],

        toFile = files[to[0]],
        toRank = ranks[to[1]],
        toCell = this.board.rows[toRank].cells[toFile];

    var piece = fromCell.querySelector(".piece"),
        emptyPiece = emptySquare.content.cloneNode(true);

    if(!piece) {
      throw "Move Error: the from square was empty";
    }

    removeNodeContent(toCell);
    removeNodeContent(fromCell);

    toCell.appendChild(piece);
    fromCell.appendChild(emptyPiece);
  }

  clear(cell) {
    var file = files[cell[0]],
        rank = ranks[cell[1]],
        boardCell = this.board.rows[rank].cells[file];

    removeNodeContent(boardCell);
  }

  put(cell, piece) {
    var file = files[cell[0]],
        rank = ranks[cell[1]],
        boardCell = this.board.rows[rank].cells[file];

    removeNodeContent(boardCell);
    setPiece(board, file, rank, "", this.unicode);
  }

  set fen(fen) {
    var clone = template.content.cloneNode(true);
    var board = clone.children[1]; // TODO: better selector please =)
    if(!fen) { return; }

    if(fen === 'start'){
      fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
    }

    var rank = 0,
        file = 0,
        fenIndex = 0;

    while(fenIndex < fen.length){
      var fenChar = fen[fenIndex],
        piece = null;

      if(fenChar === ' '){
        break; //ignore the rest
      }
      if(fenChar === '/'){
        rank++;
        file = 0;
        fenIndex++;
        continue;
      }

      if(isNaN(parseInt(fenChar, 10))) {
        setPiece(board, file, rank, fenChar, this.unicode);
        file++;
      } else {
        var count = parseInt(fenChar, 10);
        for(var i = 0; i < count; i++) {
          setPiece(board, file, rank, "", this.unicode);
          file++;
        }
      }

      fenIndex++;
    }
    removeNodeContent(this.boardRoot);
    this.boardRoot.appendChild(clone);
    this.board = this.shadowRoot.querySelector(".chessBoard");
  }
  get fen() {
    // its the beers coding, I promise.
    var board = this.shadowRoot.querySelector('.chessBoard');
    var fen = [];
    for(var i = 0; i < 8; i++) {
      var count = 0;
      for(var j=0; j < 8; j++) {
        var cell = board.rows[i].cells[j];
        var ascii = cell.querySelector('[ascii]');

        if(ascii) {
          if(count > 0) {
            fen.push(count);
            count = 0;
          }
          fen.push(ascii.attributes.ascii.value);
        } else {
          count ++;
        }

      }

      if(count > 0) {
        fen.push(count);
      }
      fen.push("/");
    }
    fen.pop();
    return fen.join("");
  }
}
ChessBoard.prototype.createdCallback = ChessBoard.prototype.constructor;
ChessBoard = document.registerElement('chess-board', ChessBoard);

/*
 *
 * Private helpers
 *
 */

function setPiece(board, file, rank, piece, unicode) {
  var row = board.rows[rank],
      cell = row.cells[file];

  removeNodeContent(cell);

  //some polyfill (FF 24.3)
  if(!(cell instanceof Node)) {
      cell = ShadowDOMPolyfill.wrap(cell);
  }

  cell.appendChild(getPieceClone(piece, unicode));
}

function removeNodeContent(node) {
  while (node.firstChild) { node.removeChild(node.firstChild); }
}

function getPieceClone(piece, unicode){
  var clone;
  if(pieces[piece]) {
    if(!unicode) {
      clone = svgPieces[piece].content.cloneNode(true);
    } else {
      clone = pieces[piece].content.cloneNode(true);
    }
  } else {
    clone = emptySquare.content.cloneNode(true);
  }
  return clone;
}

// shim css
if(Platform.ShadowCSS) {
  var templateClone = template.content.cloneNode(true);
  Platform.ShadowCSS.shimStyling(templateClone, "chess-board", "");
  var frameClone = frameTemplate.content.cloneNode(true);
  Platform.ShadowCSS.shimStyling(frameClone, "chess-board", "");
}

// export

scope.ChessBoard = ChessBoard;

})(window);
