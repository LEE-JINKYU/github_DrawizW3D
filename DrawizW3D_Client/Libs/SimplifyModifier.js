import * as THREE from 'three';

class SimplifyModifier {
  constructor() {}

  modify(geometryRaw, percentage, preserveTexture = true) {
    let geometry = geometryRaw;

    if (geometry.attributes.position.count < 51 * 3) {
      return geometryRaw;
    }

    geometry.computeVertexNormals();

    var oldVertices = geometry.attributes.position;
    var oldIndices = geometry.index;
    var oldUvs = geometry.attributes.uv;

    var vertices = new Array(oldVertices.count);
    var faces = [];
    var uvs = [];

    var i, il;

    // Add vertices
    for (i = 0, il = oldVertices.count; i < il; i++) {
      const vertex = new THREE.Vector3();
      vertex.fromBufferAttribute(oldVertices, i);
      vertices[i] = new Vertex(vertex, i);
    }

    // Add UVs
    if (preserveTexture && oldUvs) {
      for (i = 0, il = oldUvs.count; i < il; i++) {
        const uv = new THREE.Vector2();
        uv.fromBufferAttribute(oldUvs, i);
        uvs.push(uv);
      }
    }

    // Add faces
    for (i = 0, il = oldIndices.count; i < il; i += 3) {
      const a = oldIndices.getX(i);
      const b = oldIndices.getX(i + 1);
      const c = oldIndices.getX(i + 2);

      const faceUVs = uvs.length > 0 ? [uvs[a], uvs[b], uvs[c]] : [];

      const face = new Triangle(
        vertices[a],
        vertices[b],
        vertices[c],
        a,
        b,
        c,
        faceUVs,
        0 // Material index set to 0 for simplicity, replace as necessary
      );

      faces.push(face);
    }

    // Compute edge collapse costs
    for (i = 0, il = vertices.length; i < il; i++) {
      computeEdgeCostAtVertex(vertices[i]);
    }

    var nextVertex;
    var z = Math.round(vertices.length * percentage);
    var skip = 0;

    while (z--) {
      nextVertex = minimumCostEdge(vertices, skip);
      if (!nextVertex) {
        console.log("no next vertex");
        break;
      }

      var collapsed = collapse(
        vertices,
        faces,
        nextVertex,
        nextVertex.collapseNeighbor,
        preserveTexture
      );
      if (!collapsed) {
        skip++;
      }
    }

    var newGeo = new THREE.BufferGeometry();
    var newVertices = new THREE.Float32BufferAttribute(vertices.length * 3, 3);
    var newIndices = new THREE.BufferAttribute(new Uint32Array(faces.length * 3), 1);

    var posIndex = 0;
    for (i = 0, il = vertices.length; i < il; i++) {
      newVertices.setXYZ(posIndex++, vertices[i].position.x, vertices[i].position.y, vertices[i].position.z);
    }

    var index = 0;
    for (i = 0, il = faces.length; i < il; i++) {
      const face = faces[i];
      newIndices.setX(index++, vertices.indexOf(face.v1));
      newIndices.setX(index++, vertices.indexOf(face.v2));
      newIndices.setX(index++, vertices.indexOf(face.v3));
    }

    newGeo.setAttribute('position', newVertices);
    newGeo.setIndex(newIndices);
    newGeo.computeVertexNormals();
    newGeo.computeFaceNormals();
    newGeo.name = geometry.name;

    return newGeo;
  }
}

(function () {
  var cb = new THREE.Vector3(),
    ab = new THREE.Vector3();

  function pushIfUnique(array, object) {
    if (array.indexOf(object) === -1) array.push(object);
  }

  function removeFromArray(array, object) {
    var k = array.indexOf(object);
    if (k > -1) array.splice(k, 1);
  }

  function computeEdgeCollapseCost(u, v) {
    // if we collapse edge uv by moving u to v then how
    // much different will the model change, i.e. the "error".

    var edgelength = v.position.distanceTo(u.position);
    var curvature = 0;

    var sideFaces = [];
    var i,
      il = u.faces.length,
      face,
      sideFace;

    // find the "sides" triangles that are on the edge uv
    for (i = 0; i < il; i++) {
      face = u.faces[i];

      if (face.hasVertex(v)) {
        sideFaces.push(face);
      }
    }

    // use the triangle facing most away from the sides
    // to determine our curvature term
    for (i = 0; i < il; i++) {
      var minCurvature = 1;
      face = u.faces[i];

      for (var j = 0; j < sideFaces.length; j++) {
        sideFace = sideFaces[j];
        // use dot product of face normals.
        var dotProd = face.normal.dot(sideFace.normal);
        minCurvature = Math.min(minCurvature, (1.001 - dotProd) / 2);
      }

      curvature = Math.max(curvature, minCurvature);
    }

    // crude approach in attempt to preserve borders
    // though it seems not to be totally correct
    var borders = 0;
    if (sideFaces.length < 2) {
      // we add some arbitrary cost for borders,
      //borders += 1;
      curvature = 1;
    }

    var amt = edgelength * curvature + borders + computeUVsCost(u, v);

    return amt;
  }

  // check if there are multiple texture coordinates at U and V vertices(finding borders)
  function computeUVsCost(u, v) {
    if (!u.faces[0].faceVertexUvs || !u.faces[0].faceVertexUvs) return 0;
    if (!v.faces[0].faceVertexUvs || !v.faces[0].faceVertexUvs) return 0;
    var UVsAroundVertex = [];
    var UVcost = 0;
    // check if all coordinates around V have the same value
    for (var i = v.faces.length - 1; i >= 0; i--) {
      var f = v.faces[i];
      if (f.hasVertex(u)) UVsAroundVertex.push(getUVsOnVertex(f, v));
    }
    UVsAroundVertex.reduce((prev, uv) => {
      if (prev.x && (prev.x !== uv.x || prev.y !== uv.y)) {
        UVcost += 1;
      }
      return uv;
    }, {});

    UVsAroundVertex.length = 0;
    // check if all coordinates around U have the same value
    for (i = u.faces.length - 1; i >= 0; i--) {
      var f = u.faces[i];
      if (f.hasVertex(v)) UVsAroundVertex.push(getUVsOnVertex(f, u));
    }
    UVsAroundVertex.reduce((prev, uv) => {
      if (prev.x && (prev.x !== uv.x || prev.y !== uv.y)) {
        UVcost += 1;
      }
      return uv;
    }, {});

    return UVcost;
  }

  // UVs are stored per vertex (for now) so getting the right UVs means getting the UVs of the vertex that is part of face f
  function getUVsOnVertex(face, vertex) {
    var vertexIndex = -1;
    vertexIndex = face.a === vertex ? 0 : vertexIndex;
    vertexIndex = face.b === vertex ? 1 : vertexIndex;
    vertexIndex = face.c === vertex ? 2 : vertexIndex;
    return face.faceVertexUvs[0][vertexIndex];
  }

  function computeEdgeCostAtVertex(v) {
    // compute the edge collapse cost for all edges that start
    // from vertex v.  Since we are only interested in reducing
    // the object by selecting the min cost edge at each step, we
    // only cache the cost of the least cost edge at this vertex
    // (in member variable collapse) as well as the value of the
    // cost (in member variable collapseCost).

    if (v.neighbors.length === 0) {
      // collapse if no neighbors.
      v.collapseNeighbor = null;
      v.collapseCost = -0.01;

      return;
    }

    v.collapseCost = 100000;
    v.collapseNeighbor = null;

    // search all neighboring edges for "least cost" edge
    for (var i = 0; i < v.neighbors.length; i++) {
      var c = computeEdgeCollapseCost(v, v.neighbors[i]);
      if (c < v.collapseCost) {
        v.collapseCost = c;
        v.collapseNeighbor = v.neighbors[i];
      }
    }
  }

  function minimumCostEdge(vertices, length) {
    // O(n * n) approach. TODO optimize this
    var mn = vertices[0];

    for (var i = 0; i < length; i++) {
      if (vertices[i].collapseCost < mn.collapseCost) {
        mn = vertices[i];
      }
    }

    return mn;
  }

  function collapse(vertices, faces, u, v, preserveTexture) {
    // u and v are pointers to vertices of an edge

    // Collapse the edge uv by moving vertex u onto v

    if (!v) {
      // u is a vertex all by itself so just delete it..
      u.delete();
      removeFromArray(vertices, u);

      return true;
    }

    var i;
    var tmpVertices = [];

    for (i = 0; i < u.neighbors.length; i++) {
      tmpVertices.push(u.neighbors[i]);
    }

    // delete triangles on edge uv:
    for (i = u.faces.length - 1; i >= 0; i--) {
      if (u.faces[i].hasVertex(v)) {
        if (u.faces[i].sharesEdge(u, v)) {
          u.faces[i].delete();
          removeFromArray(faces, u.faces[i]);
        }
      }
    }

    // update remaining triangles to have v instead of u
    for (i = u.faces.length - 1; i >= 0; i--) {
      u.faces[i].replaceVertex(u, v);
    }

    u.delete();
    removeFromArray(vertices, u);

    // recompute the edge collapse costs in neighborhood
    for (i = 0; i < tmpVertices.length; i++) {
      computeEdgeCostAtVertex(tmpVertices[i]);
    }

    return true;
  }

  class Vertex {
    constructor(position, id) {
      this.position = position;
      this.id = id;
      this.faces = [];
      this.neighbors = [];
    }

    delete() {
      this.position = null;
      this.faces = [];
      this.neighbors = [];
    }
  }

  class Triangle {
    constructor(v1, v2, v3, id1, id2, id3, faceUVs, materialIndex) {
      this.v1 = v1;
      this.v2 = v2;
      this.v3 = v3;
      this.id1 = id1;
      this.id2 = id2;
      this.id3 = id3;
      this.normal = new THREE.Vector3();
      this.computeNormal();
      this.uvs = faceUVs || [];
      this.materialIndex = materialIndex;
    }

    computeNormal() {
      cb.subVectors(this.v3.position, this.v2.position);
      ab.subVectors(this.v1.position, this.v2.position);
      cb.cross(ab).normalize();
      this.normal.copy(cb);
    }

    hasVertex(vertex) {
      return vertex === this.v1 || vertex === this.v2 || vertex === this.v3;
    }

    sharesEdge(triangle) {
      let shared = 0;
      if (this.hasVertex(triangle.v1)) shared++;
      if (this.hasVertex(triangle.v2)) shared++;
      if (this.hasVertex(triangle.v3)) shared++;
      return shared === 2;
    }

    replaceVertex(oldVertex, newVertex) {
      if (oldVertex === this.v1) {
        this.v1 = newVertex;
      } else if (oldVertex === this.v2) {
        this.v2 = newVertex;
      } else if (oldVertex === this.v3) {
        this.v3 = newVertex;
      }
    }

    delete() {
      this.v1 = null;
      this.v2 = null;
      this.v3 = null;
      this.id1 = null;
      this.id2 = null;
      this.id3 = null;
      this.normal = null;
      this.uvs = null;
      this.materialIndex = null;
    }
  }
})();

export { SimplifyModifier };
